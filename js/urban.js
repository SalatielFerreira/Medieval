'use strict';
// Obras: estradas abertas pelo jogador, o poder do chefe de vila (na vila) e do rei (no reino todo) de criar,
// mudar de lugar e demolir estradas e imóveis, e as três formas de virar chefe de uma vila:
// fundar, conquistar pela força ou pedir ao rei.

const VILLAGE_R = 16; // raio (em blocos) da área de uma vila
const ROAD_GROUND = [T.GRASS, T.FOREST, T.HILL, T.SAND, T.SNOW];
// imóveis públicos que chefes e reis podem erguer dentro das vilas
const CIVIC = {
  vhouse: { name: 'Casa',      icon: '🏠', w: 2, h: 2, cost: { wood: 30, stone: 15 },              desc: 'Moradia para os aldeões da vila.' },
  store:  { name: 'Armazém',   icon: '🧺', w: 3, h: 2, cost: { wood: 30, stone: 10 },              desc: 'Loja de comida, tecidos e sementes.', slot: 'store' },
  smith:  { name: 'Ferreiro',  icon: '⚒️', w: 2, h: 2, cost: { stone: 25, wood: 10, iron_bar: 2 }, desc: 'Oficina do ferreiro da vila.', slot: 'smith' },
  lumber: { name: 'Madeireira', icon: '🪵', w: 2, h: 2, cost: { wood: 25, stone: 8 },              desc: 'Loja de madeira e resina.', slot: 'lumber' },
  quarry: { name: 'Pedreira',  icon: '🪨', w: 2, h: 2, cost: { wood: 15, stone: 20 },              desc: 'Loja de pedra, argila e minérios.', slot: 'quarry' },
  tavern: { name: 'Taverna',   icon: '🍺', w: 3, h: 2, cost: { wood: 35, stone: 15 },              desc: 'Mercenários, cavalos, comida e boatos.', slot: 'tavern' },
  chapel: { name: 'Capela',    icon: '⛪', w: 2, h: 2, cost: { stone: 30, wood: 15 },              desc: 'Igreja da vila, com padre.', slot: 'chapel' },
  well:   { name: 'Poço',      icon: '🪣', w: 1, h: 1, cost: { stone: 12 },                        desc: 'Poço de água para a praça.' },
  vwall:  { name: 'Muralha',   icon: '🧱', w: 1, h: 1, cost: { stone: 1 },                         desc: 'Trecho de muralha de pedra.' },
  field:  { name: 'Plantação', icon: '🌾', w: 3, h: 2, cost: { wood: 8 },                          desc: 'Campo de trigo da vila.' },
};
// construções que nunca saem do lugar
const FIXED_STRUCTS = ['camp', 'cave', 'cave_exit', 'tchest', 'shrine'];

const Urban = {
  mode: null, pick: null, drag: false, last: null, warnT: 0,

  // mudanças guardadas no jogo salvo (o mundo é refeito pela semente; só as diferenças são salvas)
  E() {
    const e = G.urban || (G.urban = {});
    e.moved = e.moved || {}; e.removed = e.removed || []; e.added = e.added || []; e.roads = e.roads || {}; e.mine = e.mine || {};
    return e;
  },

  // ------------------------------------------------------------ autoridade
  myVillages() { return World.villages.map((v, i) => ({ v, i })).filter(x => x.v.lord === 'player'); },
  villageNear(tx, ty, r) {
    let best = -1, bd = r || VILLAGE_R;
    World.villages.forEach((v, i) => { const d = U.dist(tx, ty, v.x, v.y); if (d <= bd) { bd = d; best = i; } });
    return best;
  },
  // quem manda neste lugar: o rei (todo o território do reino) ou o chefe (a área da vila)
  authority(tx, ty) {
    if (G.dungeon || !World.inb(tx, ty)) return null;
    const t = World.terr[World.idx(tx, ty)];
    if (t >= 0 && G.civs[t] && G.civs[t].ruler === 'player') return { kind: 'king', civ: t };
    for (const { v, i } of this.myVillages()) if (U.dist(tx, ty, v.x, v.y) <= VILLAGE_R) return { kind: 'chief', vi: i, civ: v.civ };
    return null;
  },
  hasAny() { return G.civs.some(c => c.ruler === 'player') || this.myVillages().length > 0; },
  // vila ou castelo de outra pessoa (onde só o chefe ou o rei mexem)
  foreignTown(tx, ty) {
    if (this.authority(tx, ty)) return null;
    const vi = this.villageNear(tx, ty);
    if (vi >= 0) return World.villages[vi].name;
    const c = World.capitals.findIndex(cp => U.dist(tx, ty, cp.x, cp.y) <= 12);
    return c >= 0 ? 'Castelo de ' + CIV_DEFS[c].short : null;
  },

  // ------------------------------------------------------------ estradas
  roadKind(t) { return t === T.WATER ? T.BRIDGE : ROAD_GROUND.includes(t) ? T.ROAD : null; },
  roadErr(tx, ty) {
    if (G.dungeon) return 'Não dá para abrir estradas nas cavernas.';
    if (!World.inb(tx, ty)) return 'Fora do mapa';
    const i = World.idx(tx, ty), t = World.tiles[i];
    if (t === T.ROAD || t === T.BRIDGE) return 'Já tem estrada aqui';
    if (World.sgrid[i] >= 0) return 'Há uma construção aqui';
    const k = this.roadKind(t);
    if (k === null) return 'Não dá para abrir estrada aqui';
    if (World.obj[i]) return 'Remova a árvore ou a rocha primeiro';
    if (U.dist(tx + 0.5, ty + 0.5, P.x / TILE, P.y / TILE) > 10) return 'Longe demais';
    const town = this.foreignTown(tx, ty);
    if (town) return `Só o chefe da vila ou o rei pode mexer nas estradas de ${town}`;


    return null;
  },
  buildRoad(tx, ty, quiet) {
    const err = this.roadErr(tx, ty);
    if (err) { if (!quiet || err !== 'Já tem estrada aqui') this.warn(err); return false; }
    const i = World.idx(tx, ty), orig = World.tiles[i], k = this.roadKind(orig);

    World.setTile(i, k);
    World.regrow = World.regrow.filter(r => r.i !== i);
    const E = this.E();
    E.roads[i] = k; E.mine[i] = orig;
    Progress.add('roads');
    Game.burst((tx + 0.5) * TILE, (ty + 0.6) * TILE, '#a8885a', 5);
    Sound.play('chop', { vol: 0.4 });
    return true;
  },
  unroadErr(tx, ty) {
    if (G.dungeon || !World.inb(tx, ty)) return 'Fora do mapa';
    const i = World.idx(tx, ty), t = World.tiles[i];
    if (t !== T.ROAD && t !== T.BRIDGE) return 'Não há estrada aqui';
    if (World.sgrid[i] >= 0) return 'Há uma construção em cima';
    if (U.dist(tx + 0.5, ty + 0.5, P.x / TILE, P.y / TILE) > 10) return 'Longe demais';
    // fora das vilas e castelos dos outros, qualquer estrada (até as do mapa) pode ser removida
    const town = this.E().mine[i] === undefined ? this.foreignTown(tx, ty) : null;
    if (town) return `Só o chefe da vila ou o rei pode mexer nas estradas de ${town}`;
    return null;
  },
  // terreno que volta no lugar de uma estrada antiga (a vizinhança decide)
  groundOf(i) {
    if (World.tiles[i] === T.BRIDGE) return T.WATER;
    const x = i % WORLD_W, y = (i / WORLD_W) | 0, n = {};
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = World.tile(x + dx, y + dy); if (ROAD_GROUND.includes(t)) n[t] = (n[t] || 0) + 1; }
    const best = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    return best !== undefined ? +best : T.GRASS;
  },
  removeRoad(tx, ty, quiet) {
    const err = this.unroadErr(tx, ty);
    if (err) { if (!quiet || err !== 'Não há estrada aqui') this.warn(err); return false; }
    const i = World.idx(tx, ty), E = this.E();
    const mine = E.mine[i] !== undefined;
    const ground = mine ? E.mine[i] : this.groundOf(i);
    World.setTile(i, ground);
    if (mine) { delete E.mine[i]; delete E.roads[i]; } else E.roads[i] = ground;

    Game.burst((tx + 0.5) * TILE, (ty + 0.6) * TILE, '#6e4f2e', 5);
    Sound.play('mine', { vol: 0.35 });
    return true;
  },

  // ------------------------------------------------------------ imóveis
  structAt(tx, ty) {
    if (!World.inb(tx, ty)) return null;
    const id = World.sgrid[World.idx(tx, ty)];
    const s = id >= 0 ? World.structs[id] : null;
    return s && !s.hidden && !s.removed ? s : null;
  },
  nameOf(s) {
    if (s.owner === 'player' && BUILDINGS[s.type]) return BUILDINGS[s.type].name;
    if (s.fam !== undefined && FAMILY_BIZ[s.type]) return Families.bizName(s);
    return (CIVIC[s.type] && CIVIC[s.type].name) || (CIV_STRUCTS[s.type] && CIV_STRUCTS[s.type].name) || s.type;
  },
  // o jogador pode mexer nesta construção?
  movable(s) {
    if (s.type === 'castle') {
      const a = this.authority(Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2));
      return a && a.kind === 'king' && a.civ === s.owner ? null : 'Só o rei deste reino pode mudar o castelo de lugar.';
    }
    if (FIXED_STRUCTS.includes(s.type)) return `${this.nameOf(s)} não pode ser mudado de lugar nem demolido.`;
    if (s.owner === 'player') return null;
    if (!this.authority(Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2))) return 'Só o chefe da vila (dentro dela) ou o rei (no reino) pode mexer nos imóveis daqui.';
    return null;
  },
  // a construção (def com w, h, blocks) cabe em (tx, ty)?  s = a que está sendo mudada; civic = imóvel de vila
  // o castelo (7×7): árvores e pedras no lugar são retiradas; precisa de um portão livre e ficar dentro do reino
  castleErr(s, tx, ty) {
    for (let y = ty; y < ty + s.h; y++) for (let x = tx; x < tx + s.w; x++) {
      if (!World.inb(x, y)) return 'Fora do mapa';
      const i = World.idx(x, y), t = World.tiles[i];
      if (!TINFO[t].walk || t === T.WATER || t === T.BRIDGE) return 'Terreno inválido (água ou montanha)';
      if (World.sgrid[i] >= 0 && World.sgrid[i] !== s.id) return 'Já há uma construção aqui';
    }
    const dx = tx + 3, dy = ty + 7;
    if (!World.inb(dx, dy) || World.isWater(World.tile(dx, dy)) || !TINFO[World.tile(dx, dy)].walk || (World.sgrid[World.idx(dx, dy)] >= 0 && World.sgrid[World.idx(dx, dy)] !== s.id)) return 'A frente do portão precisa ficar livre';
    if (P.x + P.r > tx * TILE && P.x - P.r < (tx + s.w) * TILE && P.y > ty * TILE && P.y - P.r < (ty + s.h) * TILE) return 'Você está no caminho';
    for (const [x, y] of [[tx, ty], [tx + 6, ty], [tx, ty + 6], [tx + 6, ty + 6], [tx + 3, ty + 3]]) {
      const a = this.authority(x, y);
      if (!a || a.kind !== 'king' || a.civ !== s.owner) return 'O castelo precisa ficar dentro do seu reino';
    }
    return null;
  },
  placeErr(def, tx, ty, s, civic) {
    if (s && s.type === 'castle') return this.castleErr(s, tx, ty);
    for (let y = ty; y < ty + def.h; y++) for (let x = tx; x < tx + def.w; x++) {
      if (!World.inb(x, y)) return 'Fora do mapa';
      const i = World.idx(x, y), t = World.tiles[i];
      if (!TINFO[t].walk || t === T.WATER || t === T.BRIDGE) return 'Terreno inválido';
      if (t === T.ROAD) return 'Não construa sobre a estrada';
      if (World.obj[i]) return 'Remova árvores/rochas primeiro';
      if (World.sgrid[i] >= 0 && (!s || World.sgrid[i] !== s.id)) return 'Já há uma construção aqui';
    }
    if (def.blocks !== false && P.x + P.r > tx * TILE && P.x - P.r < (tx + def.w) * TILE && P.y > ty * TILE && P.y - P.r < (ty + def.h) * TILE) return 'Você está no caminho';
    const cx = Math.floor(tx + def.w / 2), cy = Math.floor(ty + def.h / 2), a = this.authority(cx, cy);
    if (civic) {
      if (!a) return 'Aqui você não é chefe nem rei';
      const vi = s && s.village !== undefined ? s.village : this.villageNear(cx, cy, VILLAGE_R + 2);
      if (vi < 0 || !World.villages[vi]) return 'Imóveis de vila precisam ficar dentro de uma vila';
      const v = World.villages[vi];
      if (U.dist(cx, cy, v.x, v.y) > VILLAGE_R + 2) return `Precisa ficar dentro de ${v.name}`;
      if (a.kind === 'chief' && World.villages[a.vi] !== v) return 'Fora da sua vila';
      return null;
    }
    // construções do jogador: fora da sua vila ou reino, longe das cidades dos outros
    if (!a) for (const o of World.structs) {
      if (o === s || o.hidden || (typeof o.owner !== 'number' && o.owner !== 'bandit')) continue;
      if (tx < o.x + o.w + 2 && tx + def.w > o.x - 2 && ty < o.y + o.h + 2 && ty + def.h > o.y - 2) return 'Perto demais de uma cidade';
    }
    return null;
  },
  isCivic(s) { return s.owner !== 'player'; },
  relocate(s, nx, ny, quiet) {
    const ox = s.x, oy = s.y;
    for (let j = oy; j < oy + s.h; j++) for (let i = ox; i < ox + s.w; i++) { const k = World.idx(i, j); if (World.sgrid[k] === s.id) World.sgrid[k] = -1; }
    s.x = nx; s.y = ny;
    for (let j = ny; j < ny + s.h; j++) for (let i = nx; i < nx + s.w; i++) { const k = World.idx(i, j); World.sgrid[k] = s.id; World.obj[k] = 0; }
    // o conteúdo do baú (e da casa) vai junto
    const ok = ox + ',' + oy, nk = nx + ',' + ny;
    if (G.storage && G.storage[ok]) { G.storage[nk] = G.storage[ok]; delete G.storage[ok]; }
    // empreendimento de família: a família guarda a posição
    if (s.fam !== undefined) { const f = Families.get(s.fam), b = f && f.biz.find(q => q.type === s.type && q.x === ox && q.y === oy); if (b) { b.x = nx; b.y = ny; } }
    // castelo: a capital, o portão e tudo que depende deles vão junto
    if (s.type === 'castle' && World.capitals[s.owner]) { const cp = World.capitals[s.owner]; cp.x = s.x + 3; cp.y = s.y + 3; cp.door = { x: cp.x, y: cp.y + 4 }; World.chunks.clear(); }
    if (!quiet) this.record('move', s, ox, oy);
  },
  // anota a mudança para o jogo salvo (construções do jogador e das famílias já são salvas pela posição)
  record(op, s, ox, oy) {
    if (s.npcBuilt) { if (op === 'move') Homes.moved(s); else Homes.removed(s); return; }
    if (s.built || s.fam !== undefined) return;
    const E = this.E();
    if (s.added) {
      const a = E.added.find(q => q.type === s.type && q.x === ox && q.y === oy);
      if (a && op === 'move') { a.x = s.x; a.y = s.y; }
      if (a && op === 'remove') E.added.splice(E.added.indexOf(a), 1);
      return;
    }
    if (op === 'move') E.moved[s.okey] = { x: s.x, y: s.y };
    else { delete E.moved[s.okey]; if (!E.removed.includes(s.okey)) E.removed.push(s.okey); }
  },
  demolish(s) {
    if (s.type === 'castle') { UI.msg('O castelo não pode ser demolido, só mudado de lugar (pelo rei).', 'bad'); return false; }
    const err = this.movable(s);
    if (err) { UI.msg(err, 'bad'); return false; }
    Dialog.confirm({ icon: '💥', title: 'Demolir', text: `Demolir ${this.nameOf(s)}? Você recebe de volta metade do material.`, ok: 'Demolir', danger: true }, () => this.doDemolish(s));
    return false;
  },
  doDemolish(s) {
    for (const p of G.people) if (p.job === s.id) Biz.fire(p);
    const box = G.storage && G.storage[s.x + ',' + s.y];
    if (box) { for (const k in box) Inv.add(k, box[k]); delete G.storage[s.x + ',' + s.y]; UI.msg('O que estava guardado foi para a sua mochila.'); }
    if (s.fam !== undefined) { const f = Families.get(s.fam); if (f) f.biz = f.biz.filter(b => !(b.type === s.type && b.x === s.x && b.y === s.y)); }
    const def = s.owner === 'player' ? BUILDINGS[s.type] : CIVIC[s.type];
    const back = [];
    if (def && def.cost) for (const k in def.cost) { const n = Math.floor(def.cost[k] / 2); if (n > 0) { Inv.add(k, n); back.push(`${n} ${ITEMS[k].name}`); } }
    this.record('remove', s, s.x, s.y);
    World.removeStruct(s);
    Game.burst((s.x + s.w / 2) * TILE, (s.y + s.h / 2) * TILE, '#9a9488', 18);
    Sound.play('build');
    UI.msg(`💥 ${this.nameOf(s)} foi demolid${['Casa', 'Muralha', 'Plantação', 'Taverna', 'Capela', 'Pedreira', 'Madeireira'].includes(this.nameOf(s)) ? 'a' : 'o'}.${back.length ? ' Recuperou: ' + back.join(', ') + '.' : ''}`, 'gold');
    return true;
  },
  // cria um imóvel de vila (também usado ao carregar o jogo)
  addCivic(type, tx, ty, vi, quiet) {
    const d = CIVIC[type], v = World.villages[vi];
    const s = World.addStruct(type, tx, ty, d.w, d.h, v ? v.civ : 0, { village: vi, added: true });
    // loja, taverna ou capela nova assume o lugar da que não existe mais
    if (d.slot && v && (!v[d.slot] || v[d.slot].removed)) v[d.slot] = s;
    if (!quiet) this.E().added.push({ type, x: tx, y: ty, village: vi });
    return s;
  },

  // ------------------------------------------------------------ jogo salvo
  restore() {
    const E = this.E();
    for (const k in E.roads) World.tiles[+k] = E.roads[k];
    for (const k in E.roads) if (E.roads[k] === T.ROAD || E.roads[k] === T.BRIDGE) World.obj[+k] = 0;
    const byKey = new Map();
    for (const s of World.structs) if (s.okey && !s.removed && !s.built && !byKey.has(s.okey)) byKey.set(s.okey, s);
    for (const k of E.removed) { const s = byKey.get(k); if (s) World.removeStruct(s); }
    for (const k in E.moved) { const s = byKey.get(k); if (s && !s.removed) this.relocate(s, E.moved[k].x, E.moved[k].y, true); }
    for (const a of E.added) this.addCivic(a.type, a.x, a.y, a.village, true);
    World.chunks.clear();
    World.buildMinimap();
  },

  // ------------------------------------------------------------ modo de obras (clicar no mapa)
  start(mode) {
    if (G.dungeon) { UI.msg('Não dá para fazer obras dentro das cavernas.', 'bad'); return; }
    if (mode.startsWith('c:') && !this.hasAny()) { UI.msg('Só chefes de vila e reis podem erguer imóveis nas vilas.', 'bad'); return; }
    G.placing = null; this.mode = mode; this.pick = null; this.drag = false; this.last = null;
    const tips = {
      road: '🛣️ Clique (ou segure e arraste) para abrir estradas. Sobre rio raso vira ponte.',
      'u:unroad': '⛏️ Clique (ou arraste) sobre a estrada que quer remover.',
      'u:move': '🔀 Clique na construção que quer mudar de lugar.',
      'u:demolish': '💥 Clique na construção que quer demolir.',
    };
    UI.msg((tips[mode] || `🏗️ Escolha o lugar para ${CIVIC[mode.slice(2)].name} dentro da vila.`) + ' Botão direito ou Esc encerra.', 'gold');
  },
  stop() { this.mode = null; this.pick = null; this.drag = false; this.last = null; },
  mouseTile() { return { x: Math.floor(G.mouse.wx / TILE), y: Math.floor(G.mouse.wy / TILE) }; },
  ghost(w, h) { return { x: Math.floor(G.mouse.wx / TILE - w / 2 + 0.5), y: Math.floor(G.mouse.wy / TILE - h / 2 + 0.5) }; },
  warn(text) {
    if (text === this.lastWarn && G.realTime - this.warnT < 1.5) return;
    this.lastWarn = text; this.warnT = G.realTime;
    UI.msg(text, 'bad');
  },
  // botão direito: solta a construção escolhida ou encerra o modo
  cancel() { if (this.pick) { this.pick = null; UI.msg('Mudança cancelada.'); } else this.stop(); },
  click() {
    const m = this.mode, t = this.mouseTile();
    if (m === 'road' || m === 'u:unroad') { this.drag = true; this.last = null; this.paint(false); return; }
    if (m === 'u:demolish') { const s = this.structAt(t.x, t.y); if (s) this.demolish(s); else this.warn('Clique numa construção.'); return; }
    if (m === 'u:move') {
      if (!this.pick) {
        const s = this.structAt(t.x, t.y);
        if (!s) { this.warn('Clique numa construção.'); return; }
        const err = this.movable(s);
        if (err) { UI.msg(err, 'bad'); return; }
        this.pick = s;
        UI.msg(`${this.nameOf(s)} escolhid${/a$/.test(this.nameOf(s)) ? 'a' : 'o'}. Agora clique no novo lugar.`);
        return;
      }
      const s = this.pick, p = this.ghost(s.w, s.h);
      const err = this.placeErr(s, p.x, p.y, s, this.isCivic(s));
      if (err) { this.warn(err); return; }
      this.relocate(s, p.x, p.y);
      this.pick = null;
      Game.burst((p.x + s.w / 2) * TILE, (p.y + s.h / 2) * TILE, '#c9a978', 16);
      Sound.play('build');
      UI.msg(`🔀 ${this.nameOf(s)} mudou de lugar.`, 'gold');
      Progress.add('moved');
      return;
    }
    if (m.startsWith('c:')) {
      const type = m.slice(2), d = CIVIC[type], p = this.ghost(d.w, d.h);
      const err = this.placeErr(Object.assign({ blocks: CIV_STRUCTS[type].blocks }, d), p.x, p.y, null, true);
      if (err) { this.warn(err); return; }
      if (!Inv.has(d.cost)) { this.warn(`Faltam materiais para ${d.name}.`); return; }
      Inv.pay(d.cost);
      const vi = this.villageNear(Math.floor(p.x + d.w / 2), Math.floor(p.y + d.h / 2), VILLAGE_R + 2);
      this.addCivic(type, p.x, p.y, vi);
      Game.burst((p.x + d.w / 2) * TILE, (p.y + d.h / 2) * TILE, '#c9a978', 18);
      Sound.play('build');
      UI.msg(`🏗️ ${d.name} construíd${/a$/.test(d.name) ? 'a' : 'o'} em ${World.villages[vi].name}.`, 'gold');
      Progress.add('built');
      if (!Inv.has(d.cost)) this.stop();
    }
  },
  // estradas: segurando o clique, abre (ou remove) cada bloco por onde o mouse passa
  paint(quiet) {
    const t = this.mouseTile(), from = this.last || t;
    const n = Math.max(Math.abs(t.x - from.x), Math.abs(t.y - from.y));
    for (let k = this.last ? 1 : 0; k <= n; k++) {
      const x = Math.round(from.x + (t.x - from.x) * (n ? k / n : 0)), y = Math.round(from.y + (t.y - from.y) * (n ? k / n : 0));
      if (this.mode === 'road') this.buildRoad(x, y, quiet || k > 0);
      else this.removeRoad(x, y, quiet || k > 0);
    }
    this.last = t;
  },
  update() {
    if (!this.mode) return;
    if (G.dungeon) { this.stop(); return; }
    if (this.drag && (this.mode === 'road' || this.mode === 'u:unroad')) {
      const t = this.mouseTile();
      if (!this.last || t.x !== this.last.x || t.y !== this.last.y) this.paint(true);
    }
  },
  prompt() {
    const m = this.mode;
    if (m === 'road') return '🛣️ <b>Abrindo estradas</b> — clique e arraste · de graça · botão direito/Esc encerra';
    if (m === 'u:unroad') return '⛏️ <b>Removendo estradas</b> — clique e arraste · botão direito/Esc encerra';
    if (m === 'u:demolish') return '💥 <b>Demolir</b> — clique numa construção · botão direito/Esc encerra';
    if (m === 'u:move') return this.pick ? `🔀 Escolha o novo lugar para <b>${this.nameOf(this.pick)}</b> · botão direito solta` : '🔀 <b>Mudar de lugar</b> — clique numa construção · botão direito/Esc encerra';
    return `🏗️ Posicionando <b>${CIVIC[m.slice(2)].name}</b> — clique dentro da vila · botão direito/Esc encerra`;
  },
  draw(ctx, cx, cy, time) {
    if (!this.mode) return;
    const m = this.mode, t = this.mouseTile();
    const box = (x, y, w, h, ok) => { ctx.fillStyle = ok ? 'rgba(60,220,80,0.3)' : 'rgba(220,40,40,0.35)'; ctx.fillRect(x * TILE - cx, y * TILE - cy, w * TILE, h * TILE);
      ctx.strokeStyle = ok ? 'rgba(120,255,140,0.9)' : 'rgba(255,90,90,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(x * TILE - cx + 1, y * TILE - cy + 1, w * TILE - 2, h * TILE - 2); };
    const note = (x, y, text) => { ctx.font = '13px Georgia, serif'; ctx.fillStyle = '#000'; ctx.fillText(text, x * TILE - cx + 1, y * TILE - cy - 5); ctx.fillStyle = '#fff'; ctx.fillText(text, x * TILE - cx, y * TILE - cy - 6); };
    // área onde você manda (vilas suas), contornada de dourado
    for (const { v } of this.myVillages()) {
      ctx.strokeStyle = 'rgba(255,213,74,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc((v.x + 0.5) * TILE - cx, (v.y + 0.5) * TILE - cy, VILLAGE_R * TILE, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (m === 'road' || m === 'u:unroad') {
      const err = m === 'road' ? this.roadErr(t.x, t.y) : this.unroadErr(t.x, t.y);
      box(t.x, t.y, 1, 1, !err);
      if (err) note(t.x, t.y, err);
      return;
    }
    if ((m === 'u:move' && !this.pick) || m === 'u:demolish') {
      const s = this.structAt(t.x, t.y);
      if (!s) { box(t.x, t.y, 1, 1, false); return; }
      const err = this.movable(s);
      box(s.x, s.y, s.w, s.h, !err);
      note(s.x, s.y, err ? '✖ ' + this.nameOf(s) : (m === 'u:move' ? '🔀 ' : '💥 ') + this.nameOf(s));
      return;
    }
    const s = m === 'u:move' ? this.pick : null;
    const type = s ? s.type : m.slice(2);
    const d = s || Object.assign({ blocks: CIV_STRUCTS[type].blocks }, CIVIC[type]);
    const p = this.ghost(d.w, d.h);
    const a = this.authority(Math.floor(p.x + d.w / 2), Math.floor(p.y + d.h / 2));
    const err = this.placeErr(d, p.x, p.y, s, s ? this.isCivic(s) : true);
    ctx.globalAlpha = 0.6;
    World.drawStruct(ctx, Object.assign({}, s || {}, { type, w: d.w, h: d.h, owner: s ? s.owner : (a ? a.civ : 0), x: p.x, y: p.y, id: s ? s.id : 0 }), p.x * TILE - cx, p.y * TILE - cy, time);
    ctx.globalAlpha = 1;
    box(p.x, p.y, d.w, d.h, !err);
    if (err) note(p.x, p.y, err);
  },

  // ------------------------------------------------------------ painel de construção
  info(k) {
    if (k === 'road') return { name: 'Estrada', icon: '🛣️', sub: 'de graça · clique e arraste', can: true, btn: '🛣️ Abrir estradas',
      desc: 'Abre uma estrada de terra batida, onde se anda 25% mais rápido. Não gasta material. Sobre rio raso vira ponte. Dentro de vilas e castelos dos outros, só o chefe da vila ou o rei pode abrir estradas.' };
    if (k === 'u:unroad') return { name: 'Remover estrada', icon: '⛏️', sub: 'reforma', can: true, btn: '⛏️ Remover estradas',
      desc: 'Remove qualquer estrada ou ponte, inclusive as que já vêm no mapa (o terreno volta a ser campo, floresta ou rio). Dentro de vilas e castelos dos outros, só o chefe da vila ou o rei pode remover.' };
    if (k === 'u:move') return { name: 'Mudar de lugar', icon: '🔀', sub: 'reforma', can: true, btn: '🔀 Escolher a construção',
      desc: 'Clique numa construção e depois no novo lugar. As suas mudam em qualquer lugar; casas, lojas, muralhas e outros imóveis das vilas só como chefe (dentro da vila) ou rei (no reino todo). O castelo só o rei muda de lugar, sempre dentro do reino. Cavernas, acampamentos e santuários não saem do lugar.' };
    if (k === 'u:demolish') return { name: 'Demolir', icon: '💥', sub: 'reforma', can: true, btn: '💥 Escolher a construção',
      desc: 'Derruba uma construção e devolve metade do material. As suas podem ser demolidas em qualquer lugar; imóveis das vilas só pelo chefe ou pelo rei.' };
    const d = CIVIC[k.slice(2)];
    return { name: d.name, icon: d.icon, cost: d.cost, sub: `${d.w}×${d.h} · imóvel da vila`, can: Inv.has(d.cost), btn: '📍 Construir na vila',
      desc: d.desc + ' Fica dentro de uma vila sua (chefe) ou de qualquer vila do seu reino (rei).' };
  },
};

// ====================================================================== chefia das vilas
const Chiefdom = {
  t: 0,
  vilOf(p) { return World.villages.findIndex(v => v.chief === p.id); },
  // pela diplomacia: pedir a chefia ao rei
  askNeed(vi) {
    const v = World.villages[vi], t = Court.T(), noble = t.civ === v.civ && t.lvl >= 1;
    return { rel: noble ? 35 : 50, gold: Math.max(100, 250 + People.residents(vi).length * 15 - (noble ? 100 : 0)), noble };
  },
  ask(vi) {
    const v = World.villages[vi], c = G.civs[v.civ], need = this.askNeed(vi);
    G.askDay = G.askDay || {};
    if (v.lord === 'player') return;
    if (c.atWar) { UI.msg('O rei não conversa com inimigos da coroa.', 'bad'); return; }
    if (c.relation < need.rel) { UI.msg(`Precisa de relação ${need.rel}+ com ${CIV_DEFS[v.civ].short}.`, 'bad'); return; }
    if (P.gold < need.gold) { UI.msg(`A chefia de ${v.name} custa ${need.gold} 🪙.`, 'bad'); return; }
    if ((G.askDay[vi] || 0) > G.day) { UI.msg(`O rei já recusou. Tente de novo a partir de ${Calendar.text(G.askDay[vi])}.`, 'bad'); return; }
    const chance = U.clamp(0.45 + (c.relation - need.rel) / 80 + (need.noble ? 0.2 : 0), 0.1, 0.95);
    if (Math.random() < chance) {
      P.gold -= need.gold; c.treasury += need.gold;
      Game.addRelation(v.civ, 5);
      this.grant(vi, `${c.rulerName} entregou a você a chefia de ${v.name}.`);
    } else {
      G.askDay[vi] = G.day + ECON_DAYS; Game.addRelation(v.civ, -3);
      UI.msg(`${c.rulerName} recusa: "Ainda não confio tanto em você." Tente de novo no próximo mês.`, 'bad');
    }
  },
  // pela força: desafiar o chefe e derrotar a milícia da vila
  challenge(vi) {
    const v = World.villages[vi], c = G.civs[v.civ];
    if (!v || v.lord === 'player') return;
    if (c.ruler === 'player') { UI.msg('Você já é o rei desta vila.', 'bad'); return; }
    if (G.vwar) { UI.msg(`Você já está atacando ${World.villages[G.vwar.vi].name}.`, 'bad'); return; }
    const n = U.clamp(3 + Math.floor(People.residents(vi).length / 5) + ((v.level || 1) - 1), 3, 10);
    G.vwar = { vi, left: n, total: n };
    for (const p of People.residents(vi)) People.addAff(p, -10);
    UI.banner(`⚔️ Ataque a ${v.name}`);
    // o rei decide se o ataque é uma afronta à coroa ou se a vila se vira sozinha
    if (c.atWar) UI.msg(`Você já está em guerra com ${CIV_DEFS[v.civ].short}: a guarda real também vai lutar.`, 'bad');
    else {
      const ruler = c.rulerId !== null && c.rulerId !== undefined ? People.get(c.rulerId) : null, tr = ruler ? ruler.trait : '';
      const p = U.clamp(0.3 + (c.relation < 0 ? 0.25 : 0) - c.relation / 250 + ((v.level || 1) - 1) * 0.08
        + (['orgulhoso', 'desconfiado', 'corajoso'].includes(tr) ? 0.15 : 0) - (['gentil', 'alegre'].includes(tr) ? 0.1 : 0), 0.05, 0.9);
      if (Math.random() < p) {
        c.atWar = true; Game.addRelation(v.civ, -40);
        if (Court.T().civ === v.civ) Court.loseTitle('você atacou uma vila do seu suserano');
        UI.msg(`👑 ${c.rulerName} considera o ataque a ${v.name} uma afronta à coroa e declara guerra a você!`, 'bad');
        Diplo.chronicle(`⚔️ ${G.name} ${G.surname} atacou ${v.name} e ${c.rulerName} declarou guerra.`, true);
      } else {
        Game.addRelation(v.civ, -10);
        UI.msg(`👑 ${c.rulerName} decide que ${v.name} deve se defender sozinha. A coroa fica fora da briga (−10 de relação).`, 'gold');
        Diplo.chronicle(`⚔️ ${G.name} ${G.surname} atacou ${v.name}; a coroa de ${Diplo.name(v.civ)} não interveio.`);
      }
    }
    UI.msg(`Derrote os ${n} milicianos de ${v.name} para tomar a chefia. Se você se afastar, o ataque termina.`, 'bad');
  },
  update(dt) {
    const w = G.vwar;
    if (!w || G.dungeon) return;
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.5;
    const v = World.villages[w.vi];
    if (!v) { G.vwar = null; return; }
    const d = U.dist(P.x / TILE, P.y / TILE, v.x, v.y), tag = 'vmil' + w.vi;
    const alive = G.ents.filter(e => e.tag === tag && !e.dead);
    if (d > 45) {
      for (const e of alive) e.dead = true;
      G.vwar = null;
      UI.msg(`Você recuou e o ataque a ${v.name} terminou.`, 'bad');
      return;
    }
    if (w.left <= 0 && !alive.length) { this.win(w.vi); return; }
    if (d < 32 && alive.length < Math.min(5, w.left)) {
      const sp = freeSpotNear((v.x + U.rnd(-3, 3)) * TILE, (v.y + U.rnd(-2, 3)) * TILE, 3 * TILE);
      const e = Game.spawn('guard', sp.x, sp.y, { civ: v.civ, leash: 16, tag, archer: Math.random() < 0.25 });
      e.angry = true; e.militia = w.vi; e.aggroOv = 14; e.target = P;
      e.home = { x: v.x * TILE, y: v.y * TILE };
    }
  },
  killed(e) { const w = G.vwar; if (w && w.vi === e.militia) w.left = Math.max(0, w.left - 1); },
  win(vi) {
    G.vwar = null;
    this.grant(vi, `A milícia foi derrotada e ${World.villages[vi].name} se rendeu.`);
    Progress.add('villagesTaken');
  },
  grant(vi, why) {
    const v = World.villages[vi];
    v.lord = 'player'; v.lordFam = undefined;
    Families.refresh();
    UI.banner(`🏘️ Chefe de ${v.name}!`);
    UI.msg(`${why} Agora você é o chefe da vila: recebe impostos dos moradores e pode criar, mudar e demolir estradas e imóveis dentro dela (B → Obras).`, 'gold', true);
    Progress.diary(`🏘️ Tornou-se chefe de ${v.name}.`);
    Diplo.chronicle(`🏘️ ${G.name} ${G.surname} é o novo chefe de ${v.name} (${Diplo.name(v.civ)}).`, true);
    Sound.play('levelup');
  },
};

// ====================================================================== capangas de guarda
// O chefe pode deixar capangas guardando a sua vila e o rei, o castelo. Eles patrulham o lugar,
// lutam contra quem ameaçar e reforçam a defesa quando um exército ataca. Não contam como seguidores.
const GUARD_CAP = { village: 6, castle: 12 };
const Guards = {
  places() {
    return [...Urban.myVillages().map(({ i }) => ({ kind: 'village', vi: i })),
      ...G.civs.filter(c => c.ruler === 'player').map(c => ({ kind: 'castle', civ: c.id }))];
  },
  key(post) { return post.kind === 'village' ? 'v' + post.vi : 'c' + post.civ; },
  decode(k) { return k[0] === 'v' ? { kind: 'village', vi: +k.slice(1) } : { kind: 'castle', civ: +k.slice(1) }; },
  same(a, b) { return !!(a && b) && this.key(a) === this.key(b); },
  name(post) { return post.kind === 'village' ? (World.villages[post.vi] || {}).name || '?' : 'Castelo de ' + CIV_DEFS[post.civ].short; },
  valid(post) {
    if (post.kind === 'village') { const v = World.villages[post.vi]; return !!v && v.lord === 'player'; }
    return !!G.civs[post.civ] && G.civs[post.civ].ruler === 'player';
  },
  cap(post) { return GUARD_CAP[post.kind]; },
  at(post) { return G.people.filter(p => p.alive && p.capanga && this.same(p.post, post)); },
  all() { return G.people.filter(p => p.alive && p.capanga && p.post); },
  // ponto de guarda (em blocos): a praça da vila ou a frente do portão do castelo
  spot(post) {
    if (post.kind === 'village') { const v = World.villages[post.vi]; return { x: v.x + 0.5, y: v.y + 0.5 }; }
    const d = World.capitals[post.civ].door; return { x: d.x + 0.5, y: d.y + 2.5 };
  },
  despawn(p) { for (const e of G.ents) if (e.npc === p) e.dead = true; G.spawned.delete(p.id); },
  assign(p, post) {
    if (!p.capanga) return false;
    if (!this.valid(post)) { UI.msg('Você não manda mais neste lugar.', 'bad'); return false; }
    if (this.same(p.post, post)) return false;
    if (this.at(post).length >= this.cap(post)) { UI.msg(`${this.name(post)} já tem ${this.cap(post)} guardas, o máximo.`, 'bad'); return false; }
    this.despawn(p);
    p.post = { kind: post.kind, vi: post.vi, civ: post.civ };
    const s = this.spot(post);
    if (U.dist(P.x / TILE, P.y / TILE, s.x, s.y) < 30) this.spawn(p);
    UI.msg(`🛡️ ${People.full(p)} vai montar guarda em ${this.name(post)}.`, 'gold');
    return true;
  },
  recall(p) {
    if (!p.post) return false;
    if (Game.allies().length >= Game.followerCap()) { UI.msg('Você já tem seguidores demais. Dispense alguém ou consiga mais espaço (títulos, casas).', 'bad'); return false; }
    const where = this.name(p.post);
    this.despawn(p);
    p.post = null;
    Game.spawnCapanga(p);
    UI.msg(`👣 ${p.name} deixou a guarda de ${where} e voltou a seguir você.`, 'gold');
    return true;
  },
  spawn(p) {
    const s = this.spot(p.post), sp = freeSpotNear(s.x * TILE, s.y * TILE, 4 * TILE);
    const e = Game.spawn('sentry', sp.x, sp.y, { leash: 7, npc: p });
    e.aggroOv = 11;
    G.spawned.set(p.id, e);
    return e;
  },
  // os guardas aparecem no posto quando o jogador está por perto
  ambient() {
    if (G.dungeon) return;
    for (const p of this.all()) {
      if (G.spawned.has(p.id) || !this.valid(p.post)) continue;
      const s = this.spot(p.post);
      if (U.dist(P.x / TILE, P.y / TILE, s.x, s.y) < 30) this.spawn(p);
    }
  },
  // força dos guardas no lugar atacado (para batalhas resolvidas longe do jogador)
  power(target) {
    const post = target.kind === 'gate' ? { kind: 'castle', civ: target.civ } : target.kind === 'village' ? { kind: 'village', vi: target.vi } : null;
    if (!post) return 0;
    return this.at(post).reduce((s, p) => s + 2 + People.capangaStats(p).dmg / 12, 0);
  },
  // quem perdeu a vila ou o castelo volta a seguir o jogador
  dayTick() {
    for (const p of this.all()) {
      if (this.valid(p.post)) continue;
      const where = this.name(p.post);
      this.despawn(p); p.post = null;
      Game.spawnCapanga(p);
      UI.msg(`${p.name} não pode mais guardar ${where} e voltou para o seu lado.`, 'bad');
    }
  },
};
