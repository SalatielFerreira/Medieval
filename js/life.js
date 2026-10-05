'use strict';
// Vida das cidades (crescimento, muralhas e ruínas) e caravanas de comércio entre os reinos.

const Towns = {
  init() { for (const v of World.villages) if (v.prosper === undefined) Object.assign(v, { prosper: U.rnd(4, 12), level: 1, ruin: 0 }); },
  // posições de expansão calculadas sempre na mesma ordem (o resultado é igual ao recarregar o jogo)
  build(v, vi) {
    if (v.extra) return;
    v.extra = { houses: [], walls: [], well: null };
    const civ = v.civ;
    for (let r = 9; r <= 14 && v.extra.houses.length < 3; r++) for (let k = 0; k < 24 && v.extra.houses.length < 3; k++) {
      const a = k / 24 * Math.PI * 2 + vi;
      const x = Math.round(v.x + Math.cos(a) * r) - 1, y = Math.round(v.y + Math.sin(a) * r * 0.8) - 1;
      if (!World.areaOk(x - 1, y - 1, 4, 4) || !World.areaFree(x - 1, y - 1, 4, 4) || this.onRoad(x, y, 2, 2)) continue;
      v.extra.houses.push(World.addStruct('vhouse', x, y, 2, 2, civ, { growth: 2, village: vi }));
    }
    if (World.areaOk(v.x + 3, v.y - 1, 1, 1) && World.areaFree(v.x + 3, v.y - 1, 1, 1)) v.extra.well = World.addStruct('well', v.x + 3, v.y - 1, 1, 1, civ, { growth: 2, village: vi });
    const R = 16;
    for (let y = v.y - R; y <= v.y + R; y++) for (let x = v.x - R; x <= v.x + R; x++) {
      const ring = Math.max(Math.abs(x - v.x), Math.abs(y - v.y) * 1.25 | 0) === R;
      if (!ring || Math.abs(x - v.x) < 2 || Math.abs(y - v.y) < 2) continue;
      if (!World.inb(x, y) || World.blocked(x, y) || this.onRoad(x, y, 1, 1) || World.sgrid[World.idx(x, y)] >= 0) continue;
      const t = World.tile(x, y);
      if (t === T.WATER || t === T.BRIDGE) continue;
      v.extra.walls.push(World.addStruct('vwall', x, y, 1, 1, civ, { growth: 3, village: vi }));
    }
    this.show(v);
  },
  onRoad(x, y, w, h) {
    for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) { const t = World.tile(i, j); if (t === T.ROAD || t === T.BRIDGE) return true; }
    return false;
  },
  // mostra ou esconde as construções conforme o nível e as ruínas
  show(v) {
    for (const s of [...v.extra.houses, ...v.extra.walls, ...(v.extra.well ? [v.extra.well] : [])]) {
      if (s.removed) continue; // demolida pelo chefe ou pelo rei
      s.hidden = v.level < s.growth;
      s.blocks = !s.hidden;
      s.owner = v.civ;
    }
    const houses = World.structs.filter(s => s.type === 'vhouse' && !s.hidden && (s.village === World.villages.indexOf(v) || U.dist(s.x, s.y, v.x, v.y) < 9));
    houses.forEach((s, k) => { s.ruined = k < v.ruin; });
  },
  applyAll() { World.villages.forEach((v, i) => { this.build(v, i); this.show(v); }); this.syncOwners(); },
  // as construções de cada vila pertencem ao reino da vila (ex.: a vila livre que virou o seu reino)
  syncOwners() {
    for (const s of World.structs) {
      if (!s || s.village === undefined || typeof s.owner !== 'number' || s.type === 'castle') continue;
      const v = World.villages[s.village];
      if (v && s.owner !== v.civ) s.owner = v.civ;
    }
  },
  dayTick() {
    World.villages.forEach((v, vi) => {
      const c = G.civs[v.civ], raided = v.raid && v.raid.until >= G.day - ECON_DAYS;
      // vila livre: cresce por conta própria, sem depender da felicidade e do tesouro de um reino
      const happy = v.free ? 60 : c.happy, rich = v.free ? false : c.treasury > 600;
      v.prosper = U.clamp(v.prosper + (happy - 45) / 35 + (rich ? 0.5 : 0) + U.rnd(-0.4, 0.8) - (raided ? 5 : 0), 0, 30);
      if (raided && Math.random() < 0.6) v.ruin = Math.min(3, v.ruin + 1);
      else if (!raided && v.ruin > 0 && Math.random() < 0.3) v.ruin--;
      const lvl = v.prosper >= 20 ? 3 : v.prosper >= 9 ? 2 : 1;
      const known = U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 60 || c.ruler === 'player';
      if (lvl > v.level) {
        if (known) Game.note(`🏘️ ${v.name} prosperou: ${lvl === 3 ? 'ergueu muralhas!' : 'ganhou novas casas e um poço.'}`, 'gold');
        Diplo.chronicle(`🏘️ ${v.name.startsWith("Vila ") ? "A " + v.name : "A vila de " + v.name} (${v.free ? 'vila livre' : Diplo.name(v.civ)}) cresceu e chegou ao nível ${lvl}.`);
        if (lvl === 2) { const fam = People.create({ rank: 'peasant', civ: v.civ, home: { type: 'village', idx: vi }, age: U.rint(20, 40) }); fam.met = false; }
      } else if (lvl < v.level && known) UI.msg(`🏚️ ${v.name} está em decadência.`, 'bad');
      v.level = lvl;
      this.show(v);
    });
    this.syncOwners();
    NpcRoads.tick(); // moradores abrem caminhos até as casas e lojas
    Faith.monthTick();
    People.purseTick(); // as lojas rendem para os próprios donos
    Ports.monthTick();
  },
};

// ====================================================================== caravanas
const CARAVAN_GOODS = [['spices', 2, 5], ['silk_cloth', 1, 3], ['wine', 2, 5], ['iron_bar', 3, 6], ['cloth', 3, 6], ['honey', 2, 4]];
const Caravans = {
  list() { return G.caravans || (G.caravans = []); },
  dayTick() {
    G.caravans = this.list().filter(c => !c.done);
    for (let k = 0; k < 2 && G.caravans.length < 8; k++) {
      const a = U.rint(0, CIV_DEFS.length - 1), b = (a + U.rint(1, CIV_DEFS.length - 1)) % CIV_DEFS.length;
      if (Diplo.atWar(a, b)) continue;
      const path = World.findPath(World.capitals[a].door.x, World.capitals[a].door.y, World.capitals[b].door.x, World.capitals[b].door.y);
      if (!path || path.length < 20) continue;
      path.reverse();
      this.list().push({
        id: G.day * 10 + k, from: a, to: b, path, pos: 0, done: false, robbed: false, escort: 0, ambush: Math.random() < 0.4, ambushed: false,
        goods: CARAVAN_GOODS.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(([it, x, y]) => ({ k: it, n: U.rint(x, y) })),
      });
      Diplo.chronicle(`🐫 Uma caravana partiu de ${Diplo.name(a)} rumo a ${Diplo.name(b)}.`);
    }
  },
  tile(c) { const i = c.path[Math.min(c.path.length - 1, Math.floor(c.pos))]; return { x: i % WORLD_W, y: (i / WORLD_W) | 0 }; },
  update(dt) {
    if (G.dungeon) return;
    for (const c of this.list()) {
      if (c.done) continue;
      const t = this.tile(c), d = U.dist(P.x / TILE, P.y / TILE, t.x, t.y);
      const ent = G.ents.find(e => e.kind === 'caravan' && e.carId === c.id && !e.dead);
      if (!ent) {
        if (c.entGone) { c.done = true; continue; }
        c.pos += dt * 1.2;
        if (d < 30) this.spawn(c, t);
      } else {
        c.pos = ent.pathPos;
        if (d < 12) c.escort += dt;
        if (c.ambush && !c.ambushed && c.escort > 6) {
          c.ambushed = true;
          for (let k = 0; k < 4; k++) { const sp = freeSpotNear(ent.x + U.rnd(-200, 200), ent.y + U.rnd(-160, 160), 60); Game.spawn('bandit', sp.x, sp.y, { leash: 18, tag: 'amb' + c.id, archer: k === 0 }); }
          UI.banner('⚠️ Bandidos atacam a caravana!'); UI.msg('Defenda a caravana e receba uma recompensa do reino!', 'bad');
        }
        if (d > 46) { ent.dead = true; }
      }
      if (c.pos >= c.path.length - 1) this.arrive(c, ent);
    }
  },
  spawn(c, t) {
    const e = Game.spawn('caravan', (t.x + 0.5) * TILE, (t.y + 0.8) * TILE, { civ: c.from, leash: 999 });
    e.carId = c.id; e.car = c; e.pathPos = c.pos;
    for (let k = 0; k < (c.owner === 'player' ? c.guards : 2); k++) {
      const g = Game.spawn('guard', e.x - 30 - k * 20, e.y + 12, { civ: c.from, leash: 4, tag: 'carg' + c.id });
      g.follow = e;
    }
  },
  arrive(c, ent) {
    c.done = true;
    if (ent) ent.dead = true;
    for (const e of G.ents) if (e.tag === 'carg' + c.id) e.dead = true;
    if (c.owner === 'player') { Market.arrive(c); return; }
    if (c.ambushed && !c.robbed && c.escort > 15) {
      const g = U.rint(70, 140);
      P.gold += g; Game.addRelation(c.from, 10); Game.gainXp(40);
      UI.msg(`🐫 A caravana chegou em segurança graças a você! ${Diplo.name(c.from)} paga ${g} 🪙 (+10 relação).`, 'gold');
      Progress.add('caravansSaved'); Court.addService(c.from, 5);
    }
  },
  // assalto: o jogador ataca a caravana
  rob(c, ent) {
    if (c.owner === 'player') return;
    c.robbed = true; ent.hostileToPlayer = true; Market.robbed(c);
    Game.addRelation(c.from, -35);
    for (const e of G.ents) if (e.tag === 'carg' + c.id) e.target = P;
    UI.msg(`Você atacou a caravana de ${Diplo.name(c.from)}! Seus guardas reagem. (−35 relação)`, 'bad');
  },
  loot(c, e) {
    const g = U.rint(60, 150);
    P.gold += g;
    for (const it of c.goods) Inv.add(it.k, it.n);
    UI.msg(`Você saqueou a caravana: ${g} 🪙 e ${c.goods.map(x => x.n + ' ' + ITEMS[x.k].name).join(', ')}.`, 'gold');
    c.done = true; c.entGone = true;
    Progress.add('caravansRobbed'); Faith.addSin(1, 'Saquear uma caravana');
  },
  // movimento da entidade da caravana pela estrada
  move(e, dt) {
    const c = e.car;
    if (!c || c.done) { e.dead = true; return; }
    const i = c.path[Math.min(c.path.length - 1, Math.floor(e.pathPos) + 1)];
    const tx = (i % WORLD_W + 0.5) * TILE, ty = (((i / WORLD_W) | 0) + 0.8) * TILE;
    const enemies = G.ents.some(o => !o.dead && o.kind === 'bandit' && U.dist(o.x, o.y, e.x, e.y) < 5 * TILE);
    if (enemies) { e.moving = false; return; }
    const dx = tx - e.x, dy = ty - e.y, L = Math.hypot(dx, dy);
    if (L < 6) { e.pathPos = Math.min(c.path.length - 1, Math.floor(e.pathPos) + 1); return; }
    e.x += dx / L * 46 * dt; e.y += dy / L * 46 * dt; e.moving = true;
    if (Math.abs(dx) > 1) e.dir = dx < 0 ? -1 : 1;
  },
};
function drawCaravan(ctx, x, y, dir, anim, moving, col, hurt) {
  drawHorse(ctx, x + dir * 26, y, dir, anim, moving, '#7a4a26', false);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(-8, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hurt ? '#ff8080' : '#8b5a2b'; ctx.fillRect(-28, -24, 40, 16);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-30, -24); ctx.quadraticCurveTo(-8, -48, 14, -24); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-20, -36, 3, 12); ctx.fillRect(-4, -38, 3, 14);
  const r = anim * (moving ? 6 : 0);
  for (const wx of [-20, 4]) {
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, -6, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx + Math.cos(r) * 7, -6 + Math.sin(r) * 7); ctx.lineTo(wx - Math.cos(r) * 7, -6 - Math.sin(r) * 7); ctx.stroke();
  }
  ctx.restore();
}

// ====================================================================== trabalho dos civis
// Camponeses, andarilhos e mendigos (quem não tem ofício) cortam árvores, quebram pedras e colhem plantas
// perto de casa, dentro do próprio reino, e levam o que juntaram para a vila.
const GATHER_RANKS = ['peasant', 'wanderer', 'beggar'];
const NPCWork = {
  can(e) {
    const p = e.npc;
    return !!p && p.alive && GATHER_RANKS.includes(p.rank) && p.age >= 16 && !p.capanga && (p.job === undefined || p.job === null) &&
      !p.kin && !p.council && p.spouse !== 'player' && !p.hostile && e.kind === 'villager';
  },
  update(e, dt, sp) {
    if (!this.can(e) || G.dungeon) return false;
    const w = e.work || (e.work = { mode: 'idle', t: U.rnd(2, 10) });
    // à noite todos voltam para casa
    if (G.darkness > 0.55 && w.mode !== 'return') { if (w.mode !== 'idle') { w.mode = w.carry ? 'return' : 'idle'; w.t = 30; } if (w.mode === 'idle') return false; }
    const tilePos = i => ({ x: (i % WORLD_W + 0.5) * TILE, y: (((i / WORLD_W) | 0) + 1) * TILE });
    switch (w.mode) {
      case 'idle':
        w.t -= dt;
        if (w.t <= 0 && !(G.darkness > 0.55) && !this.pick(e, w)) w.t = U.rnd(6, 14);
        return false;
      case 'go': {
        if (World.obj[w.i] !== w.type) { w.mode = 'idle'; w.t = 2; return false; }
        const d = U.dist(e.x, e.y, w.ax, w.ay);
        w.t -= dt; w.chk -= dt;
        if (d < 16) { w.mode = 'work'; w.t = 1.2; return true; }
        e.moveToward(w.ax, w.ay, sp * 0.6, dt);
        // sem progresso: desiste deste alvo e procura outro
        if (w.chk <= 0) { if (w.lastD - d < 6) { (e.badT = e.badT || []).push(w.i); w.mode = 'idle'; w.t = 1; } w.lastD = d; w.chk = 2; }
        if (w.t <= 0) { w.mode = 'idle'; w.t = 4; }
        return true;
      }
      case 'work': {
        if (World.obj[w.i] !== w.type) { w.mode = 'idle'; w.t = 2; return true; }
        const p = tilePos(w.i);
        e.dir = p.x < e.x ? -1 : 1; e.aim = Math.atan2(p.y - 20 - e.y, p.x - e.x);
        w.t -= dt;
        if (w.t <= 0) {
          w.t = 1.2;
          const o = OBJ[w.type];
          e.swing = 0.28;
          World.objHp[w.i] = Math.max(0, World.objHp[w.i] - 1);
          World.shake(w.i);
          const near = U.dist(e.x, e.y, P.x, P.y) < 9 * TILE;
          if (near) { Sound.play(o.tool === 'axe' ? 'chop' : o.tool === 'pick' ? 'mine' : 'pickup', { vol: 0.35 }); Game.burst(p.x, p.y - 16, o.pc, 3); }
          if (World.objHp[w.i] <= 0) {
            const res = Object.keys(o.drops), k = res[0], [a, b] = o.drops[k];
            w.carry = { k, n: Math.max(1, U.rint(a, b)) };
            World.removeObj(w.i);
            if (near) Game.burst(p.x, p.y - 16, o.pc, 10);
            w.mode = 'return'; w.t = 40;
          }
        }
        return true;
      }
      case 'return': {
        const h = e.home;
        w.t -= dt;
        if (U.dist(e.x, e.y, h.x, h.y) > 26 && w.t > 0) e.moveToward(h.x, h.y, sp * 0.55, dt);
        else this.deposit(e, w);
        return true;
      }
    }
    return false;
  },
  // procura algo para coletar perto de casa, no território do reino
  pick(e, w) {
    const hx = Math.floor(e.home.x / TILE), hy = Math.floor(e.home.y / TILE), civ = Families.civOf(e.npc);
    const sx = Math.floor(World.start.x), sy = Math.floor(World.start.y);
    let best = null, bd = 1e9;
    for (let k = 0; k < 45; k++) {
      const x = hx + U.rint(-12, 12), y = hy + U.rint(-10, 10);
      if (!World.inb(x, y)) continue;
      const i = World.idx(x, y), t = World.obj[i];
      if (!t || OBJ[t].min > 1 || World.terr[i] !== civ) continue;
      if (Math.abs(x - sx) < 9 && Math.abs(y - sy) < 9) continue; // não mexe perto da cabana do jogador
      if (e.badT && e.badT.includes(i)) continue;
      if (G.ents.some(o => o !== e && o.work && o.work.i === i && o.work.mode !== 'idle')) continue;
      // precisa de um lugar livre ao lado para trabalhar
      const side = [[0, 1], [-1, 0], [1, 0], [0, -1]].find(([dx, dy]) => !World.blocked(x + dx, y + dy));
      if (!side) continue;
      const d = U.dist(x, y, e.x / TILE, e.y / TILE);
      if (d < bd) { bd = d; best = { i, ax: (x + side[0] + 0.5) * TILE, ay: (y + side[1] + 0.8) * TILE }; }
    }
    if (best === null) return false;
    w.mode = 'go'; w.i = best.i; w.ax = best.ax; w.ay = best.ay; w.type = World.obj[best.i]; w.t = 30; w.chk = 2; w.lastD = 1e9;
    if (e.badT && e.badT.length > 12) e.badT.splice(0, 6);
    return true;
  },
  // entrega o que juntou: vai para o armazém do reino e enriquece a família
  deposit(e, w) {
    const c = w.carry;
    w.mode = 'idle'; w.t = U.rnd(5, 12); w.carry = null;
    if (!c) return;
    const civ = Families.civOf(e.npc), C = G.civs[civ];
    if (C && C.stock[c.k] !== undefined) C.stock[c.k] += c.n;
    const f = Families.of(e.npc);
    if (f) f.wealth += Math.max(1, Math.round(ITEMS[c.k].price * c.n * 0.5));
    if (G.stats) G.stats.npcGathered = (G.stats.npcGathered || 0) + c.n;
  },
  toolOf(e) { const w = e.work; return w && w.mode === 'work' && World.obj[w.i] ? OBJ[World.obj[w.i]].tool : null; },
};

// ================================================================ estradas dos moradores
// Os moradores ligam as casas, lojas, capelas e empreendimentos da vila à estrada mais próxima (a que liga
// as vilas e castelos). Cada vila abre até 2 caminhos por mês; no começo do jogo as vilas já nascem ligadas.
// As estradas ficam em G.npcRoads (índices dos blocos) e são refeitas ao carregar o jogo.
const ROAD_TYPES = ['vhouse', 'store', 'tavern', 'smith', 'lumber', 'quarry', 'chapel'];
const NpcRoads = {
  isRoad(i) { const t = World.tiles[i]; return t === T.ROAD || t === T.BRIDGE; },
  // porta: o bloco logo abaixo do meio da construção
  door(s) { return { x: s.x + Math.floor(s.w / 2), y: s.y + s.h }; },
  wants(s) { return s && !s.removed && !s.hidden && s.village !== undefined && (ROAD_TYPES.includes(s.type) || s.fam !== undefined) && World.villages[s.village]; },
  connected(s) {
    const d = this.door(s);
    if (!World.inb(d.x, d.y)) return true;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1]]) { const x = d.x + dx, y = d.y + dy; if (World.inb(x, y) && this.isRoad(World.idx(x, y))) return true; }
    return false;
  },
  // caminho mais curto (busca em largura numa janela ao redor da porta) até qualquer bloco de estrada
  path(s, R = 22) {
    const d = this.door(s);
    if (!World.inb(d.x, d.y) || World.sgrid[World.idx(d.x, d.y)] >= 0 || World.isWater(World.tiles[World.idx(d.x, d.y)])) return null;
    const W = 2 * R + 1, from = new Int32Array(W * W).fill(-2), q = [];
    const loc = (x, y) => (y - d.y + R) * W + (x - d.x + R);
    from[loc(d.x, d.y)] = -1; q.push(d.x, d.y);
    for (let h = 0; h < q.length; h += 2) {
      const x = q[h], y = q[h + 1], i = World.idx(x, y);
      if (this.isRoad(i)) {
        const out = []; let k = loc(x, y);
        for (let cx = x, cy = y; ; ) { const p = from[k]; if (p === -1) break; const px = p % W + d.x - R, py = ((p / W) | 0) + d.y - R; out.push(World.idx(px, py)); k = p; cx = px; cy = py; }
        return out.length <= 34 ? out : null;
      }
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx, ny = y + dy;
        if (Math.abs(nx - d.x) > R || Math.abs(ny - d.y) > R || !World.inb(nx, ny)) continue;
        const l = loc(nx, ny); if (from[l] !== -2) continue;
        const ni = World.idx(nx, ny);
        if (World.sgrid[ni] >= 0 || (World.isWater(World.tiles[ni]) && World.tiles[ni] !== T.BRIDGE)) continue;
        from[l] = loc(x, y); q.push(nx, ny);
      }
    }
    return null;
  },
  build(s) {
    const p = this.path(s);
    if (!p || !p.length) { s.noRoad = G.day; return false; }
    World.carveRoad(p);
    G.npcRoads = G.npcRoads || [];
    for (const i of p) G.npcRoads.push(i);
    return true;
  },
  // por mês: cada vila liga até n construções (as que não acharam caminho tentam de novo daqui a um ano)
  tick(n = 2) {
    if (G.dungeon) return;
    let any = false;
    const per = {};
    for (const s of World.structs) {
      if (!this.wants(s) || this.connected(s) || (s.noRoad !== undefined && G.day - s.noRoad < 12)) continue;
      if ((per[s.village] = (per[s.village] || 0) + 1) > n) continue;
      if (this.build(s)) any = true;
    }
    if (any) { World.chunks.clear(); if (World.mini) World.buildMinimap(); }
    return any;
  },
  // começo do jogo: todas as vilas já ligadas
  init() { this.tick(99); },
  // ao carregar: refaz as estradas abertas pelos moradores
  restore() {
    for (const i of G.npcRoads || []) if (World.sgrid[i] < 0 && !this.isRoad(i)) World.carveRoad([i]);
  },
};

// ================================================================ portos
// Um porto na costa perto de cada castelo que tem mar por perto (lugar sempre igual para o mesmo mundo).
// O mestre do porto compra peixes, polvos, tubarões e baleias com a bolsa do porto e vende barcos e varas.
const PORT_BUYS = ['trout', 'carp', 'sardine', 'cod', 'octopus', 'shark', 'whale', 'goldfish', 'cooked_fish'];
const PORT_SELLS = [['boat', 120], ['fishing_rod', 25], ['rope', 6]];
const Ports = {
  list() { return World.structs.filter(s => s && s.type === 'port' && !s.removed); },
  state(s) { G.ports = G.ports || {}; const k = s.x + ',' + s.y; return G.ports[k] || (G.ports[k] = { purse: 2500 }); },
  // procura uma faixa de costa (terra com água ao sul ou ao lado) até 34 blocos do castelo
  place() {
    if ((G.terrain || 0) < 3 || this.list().length) return;
    for (let ci = 0; ci < Math.min(World.capitals.length, 7); ci++) {
      const cp = World.capitals[ci]; let best = null, bd = 1e9;
      for (let y = cp.y - 34; y <= cp.y + 34; y++) for (let x = cp.x - 34; x <= cp.x + 34; x++) {
        if (!World.areaOk(x, y, 4, 3) || !World.areaFree(x, y, 4, 3)) continue;
        let land = true; for (let j = y; j < y + 3 && land; j++) for (let i = x; i < x + 4; i++) { const t = World.tiles[World.idx(i, j)]; if (!TINFO[t].walk || World.isWater(t) || t === T.ROAD) { land = false; break; } }
        if (!land) continue;
        let water = 0; for (let i = x - 1; i <= x + 4; i++) { if (World.inb(i, y + 3) && World.isWater(World.tiles[World.idx(i, y + 3)])) water++; }
        if (water < 4) continue;
        const d = U.dist(x, y, cp.x, cp.y); if (d < bd && d > 9) { bd = d; best = { x, y }; }
      }
      if (!best) continue;
      for (let j = best.y; j < best.y + 3; j++) for (let i = best.x; i < best.x + 4; i++) World.obj[World.idx(i, j)] = 0;
      const st = World.addStruct('port', best.x, best.y, 4, 3, ci);
      const path = World.findPath(best.x + 1, best.y - 1, cp.door.x, cp.door.y); if (path) World.carveRoad(path);
    }
    World.chunks = new Map(); if (World.mini) World.buildMinimap();
  },
  price(k) { const it = ITEMS[k]; return Math.max(1, Math.round(it.price * (k === 'whale' || k === 'shark' || k === 'octopus' ? 1 : 0.9))); },
  sell(sid, k, n) {
    const s = World.structs[sid], st = this.state(s), pr = this.price(k);
    n = Math.min(n, Inv.count(k), Math.floor(st.purse / pr));
    if (n <= 0) { UI.msg(Inv.count(k) ? 'O mestre do porto não tem dinheiro para isso agora.' : 'Você não tem isso.', 'bad'); return; }
    Inv.add(k, -n); P.gold += n * pr; st.purse -= n * pr; Sound.play('coin');
    UI.msg(`⚓ Vendeu ${n}× ${ITEMS[k].name} por ${n * pr} Salin.`, 'gold');
  },
  buy(sid, k, price) {
    const st = this.state(World.structs[sid]);
    if (P.gold < price) { UI.msg('Salin insuficiente.', 'bad'); return; }
    P.gold -= price; st.purse += price; Inv.add(k, 1); UI.msg(`⚓ Comprou ${ITEMS[k].name}.`, 'gold');
  },
  monthTick() { for (const k in G.ports || {}) G.ports[k].purse = Math.min(6000, G.ports[k].purse + 400); },
};
