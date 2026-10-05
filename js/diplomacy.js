'use strict';
// Reinos vivos: relações entre os reinos, guerras, alianças, casamentos reais e crônicas do mundo.

const Diplo = {
  init() {
    const n = CIV_DEFS.length, rel = [];
    for (let a = 0; a < n; a++) { rel.push([]); for (let b = 0; b < n; b++) rel[a].push(0); }
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) rel[a][b] = rel[b][a] = U.rint(-45, 45);
    G.diplo = { rel, wars: [], allies: [], log: [] };
  },
  D() { if (!G.diplo) this.init(); return G.diplo; },
  rel(a, b) { return this.D().rel[a][b]; },
  addRel(a, b, n) { const r = this.D().rel; r[a][b] = r[b][a] = U.clamp(r[a][b] + n, -100, 100); },
  pairKey(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); },
  atWar(a, b) { return a !== b && this.D().wars.some(w => this.pairKey(w.a, w.b) === this.pairKey(a, b)); },
  allied(a, b) { return a !== b && this.D().allies.includes(this.pairKey(a, b)); },
  warsOf(a) { return this.D().wars.filter(w => w.a === a || w.b === a); },
  name(c) { return CIV_DEFS[c].short; },
  chronicle(text, important) {
    const D = this.D();
    D.log.unshift({ day: G.day, text });
    if (D.log.length > 80) D.log.length = 80;
    if (important) UI.msg('📜 ' + text, 'gold', true);
  },
  // o jogador sente as notícias dos reinos que governa ou onde está
  involves(...cs) { return cs.some(c => G.civs[c] && G.civs[c].ruler === 'player'); },

  declareWar(a, b, why) {
    if (this.atWar(a, b)) return;
    const D = this.D();
    D.allies = D.allies.filter(k => k !== this.pairKey(a, b));
    D.wars.push({ a, b, since: G.day });
    this.addRel(a, b, -20);
    this.chronicle(`⚔️ ${this.name(a)} declarou guerra a ${this.name(b)}${why ? ' — ' + why : ''}.`, true);
    // o jogador que governa um dos lados entra na guerra: os soldados inimigos passam a atacá-lo
    if (G.civs[a].ruler === 'player' && G.civs[b].ruler !== 'player') G.civs[b].atWar = true;
    if (G.civs[b].ruler === 'player' && G.civs[a].ruler !== 'player') G.civs[a].atWar = true;
    // aliados entram na guerra
    for (const k of D.allies.slice()) {
      const [x, y] = k.split('-').map(Number);
      const ally = x === b ? y : y === b ? x : -1;
      if (ally >= 0 && ally !== a && !this.atWar(ally, a) && this.rel(ally, a) < 20) {
        D.wars.push({ a: ally, b: a, since: G.day });
        this.chronicle(`🛡️ ${this.name(ally)} honra a aliança e entra na guerra contra ${this.name(a)}.`);
      }
    }
  },
  makePeace(a, b, why) {
    const D = this.D();
    D.wars = D.wars.filter(w => this.pairKey(w.a, w.b) !== this.pairKey(a, b));
    this.D().rel[a][b] = this.D().rel[b][a] = Math.max(this.rel(a, b), -15);
    this.chronicle(`🕊️ ${this.name(a)} e ${this.name(b)} assinaram a paz${why ? ' — ' + why : ''}.`, this.involves(a, b));
    for (const [x, y] of [[a, b], [b, a]]) if (G.civs[x].ruler === 'player' && G.civs[y].ruler !== 'player' && !this.warsOf(y).some(w => G.civs[w.a].ruler === 'player' || G.civs[w.b].ruler === 'player')) G.civs[y].atWar = false;
  },
  ally(a, b) {
    const D = this.D(), k = this.pairKey(a, b);
    if (D.allies.includes(k) || this.atWar(a, b)) return;
    D.allies.push(k);
    this.addRel(a, b, 15);
    this.chronicle(`🤝 ${this.name(a)} e ${this.name(b)} firmaram uma aliança.`, this.involves(a, b));
  },
  royalWedding(a, b) {
    const free = c => G.people.filter(p => p.alive && p.rank === 'heir' && p.civ === c && p.age >= 17 && p.spouse === null && !p.kin);
    const ha = free(a), hb = free(b);
    if (!ha.length || !hb.length) return false;
    const x = ha[0], y = hb.find(p => p.sex !== x.sex);
    if (!y) return false;
    People.marry(x, y);
    y.home = { type: 'castle', civ: a }; y.civ = a;
    this.addRel(a, b, 25);
    this.chronicle(`💍 Casamento real: ${People.title(x)} ${x.name} de ${this.name(a)} casou-se com ${People.title(y)} ${y.name} de ${this.name(b)}.`, true);
    this.ally(a, b);
    return true;
  },
  strength(c) {
    const civ = G.civs[c];
    let s = civ.garrison + civ.invest.walls * 3 + Math.min(10, civ.treasury / 150);
    for (const k of this.D().allies) { const [x, y] = k.split('-').map(Number); if (x === c || y === c) s += G.civs[x === c ? y : x].garrison * 0.25; }
    return s;
  },
  villagesOf(c) { return World.villages.filter(v => v.civ === c && !v.free); },

  // ------------------------------------------------------------ um dia no mundo
  tickDay() {
    if (G.dungeon) return; // as mudanças de território precisam do mapa do mundo carregado
    const D = this.D(), n = CIV_DEFS.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      let drift = U.rnd(-5, 4.5);
      if (this.allied(a, b)) drift += 1.5;
      if (this.atWar(a, b)) drift -= 1;
      this.addRel(a, b, drift);
    }
    // incidentes e acordos mexem nas relações e viram notícia
    if (Math.random() < 0.35) {
      const a = U.rint(0, n - 1), b = (a + U.rint(1, n - 1)) % n;
      if (Math.random() < 0.55) {
        this.addRel(a, b, -U.rint(12, 25));
        this.chronicle(`⚠️ ${U.pick(['Incidente de fronteira', 'Caravana saqueada', 'Embaixador expulso', 'Disputa por um rio', 'Espião capturado'])} entre ${this.name(a)} e ${this.name(b)}.`);
      } else {
        this.addRel(a, b, U.rint(10, 20));
        this.chronicle(`📦 ${U.pick(['Acordo comercial', 'Festa de amizade', 'Troca de presentes', 'Torneio conjunto'])} entre ${this.name(a)} e ${this.name(b)}.`);
      }
    }
    // eventos diplomáticos (só entre reinos governados pela IA, ou contra o jogador)
    for (let k = 0; k < 2; k++) {
      const a = U.rint(0, n - 1), b = (a + U.rint(1, n - 1)) % n;
      const r = this.rel(a, b), aiA = G.civs[a].ruler !== 'player';
      if (aiA && r < -40 && !this.atWar(a, b) && this.warsOf(a).length < 2) this.declareWar(a, b, U.pick(['disputa de fronteira', 'insulto na corte', 'roubo de gado', 'cobiça por suas minas']));
      else if (r > 45 && !this.allied(a, b) && aiA && G.civs[b].ruler !== 'player') this.ally(a, b);
      else if (r > 25 && aiA && G.civs[b].ruler !== 'player' && Math.random() < 0.3) this.royalWedding(a, b);
    }
    // batalhas das guerras em andamento
    for (const w of D.wars.slice()) {
      const sa = this.strength(w.a) + U.rnd(0, 8), sb = this.strength(w.b) + U.rnd(0, 8);
      const [win, lose] = sa >= sb ? [w.a, w.b] : [w.b, w.a];
      const L = G.civs[lose], Wn = G.civs[win];
      L.garrison = Math.max(0, L.garrison - U.rint(1, 3));
      Wn.garrison = Math.max(0, Wn.garrison - U.rint(0, 1));
      const loot = Math.min(L.treasury, U.rint(40, 140));
      L.treasury -= loot; Wn.treasury += loot;
      L.happy = Math.max(0, L.happy - 4);
      const targets = this.villagesOf(lose);
      if (targets.length) {
        const v = targets.reduce((best, x) => U.dist(x.x, x.y, World.capitals[win].x, World.capitals[win].y) < U.dist(best.x, best.y, World.capitals[win].x, World.capitals[win].y) ? x : best, targets[0]);
        v.raid = { by: win, until: G.day + ECON_DAYS };
        if (this.involves(lose)) UI.msg(`🔥 ${this.name(win)} está atacando ${v.name}! Vá defender a vila.`, 'bad');
        if (L.garrison < 3 && targets.length > 1 && Math.random() < 0.35) this.captureVillage(v, win);
      }
      const dur = G.day - w.since;
      if ((dur > 5 * ECON_DAYS && Math.random() < 0.3) || (L.garrison <= 0 && G.civs[lose].ruler !== 'player')) {
        const tribute = Math.min(L.treasury, 200);
        L.treasury -= tribute; Wn.treasury += tribute;
        this.makePeace(w.a, w.b, tribute ? `${this.name(lose)} pagou ${tribute} moedas de tributo` : 'os dois lados estão exaustos');
      }
    }
  },
  captureVillage(v, winner, quiet) {
    const old = v.civ, vi = World.villages.indexOf(v);
    v.civ = winner; v.raid = null;
    for (const s of World.structs) {
      if (s.owner !== old) continue;
      if (s.village === vi || U.dist(s.x, s.y, v.x, v.y) < 9) s.owner = winner;
    }
    for (let y = v.y - 18; y <= v.y + 18; y++) for (let x = v.x - 18; x <= v.x + 18; x++) {
      if (!World.inb(x, y)) continue;
      const i = World.idx(x, y);
      if (World.terr[i] === old && U.dist(x, y, v.x, v.y) < 17) World.terr[i] = winner;
    }
    for (const p of G.people) if (p.alive && p.home.type === 'village' && p.home.idx === vi) p.civ = winner;
    World.chunks = new Map();
    if (quiet) return;
    World.buildMinimap();
    this.chronicle(`🏴 ${this.name(winner)} conquistou ${v.name.startsWith("Vila ") ? "a " + v.name : "a vila de " + v.name}, que pertencia a ${this.name(old)}.`, true);
    if (G.civs[old].ruler === 'player') UI.banner(`🔥 ${v.name} foi tomada por ${this.name(winner)}!`);
  },

  // ------------------------------------------------------------ ações do jogador como soberano
  playerAction(mine, other, act) {
    const c = G.civs[mine];
    if (act === 'gift' && c.treasury >= 100) { c.treasury -= 100; this.addRel(mine, other, 12); UI.msg(`Presentes enviados a ${this.name(other)} (+12 relação).`, 'gold'); }
    if (act === 'ally' && c.treasury >= 200 && this.rel(mine, other) >= 40) { c.treasury -= 200; this.ally(mine, other); }
    if (act === 'peace' && c.treasury >= 300 && this.atWar(mine, other)) { c.treasury -= 300; G.civs[other].treasury += 300; this.makePeace(mine, other, `${G.name} pagou 300 moedas`); }
    if (act === 'war' && !this.atWar(mine, other)) this.declareWar(mine, other, `ordem de ${G.name}`);
  },
};

// ====================================================================== fronteiras do reino
// O reino ganha terra selvagem (que não é de reino nenhum) de dois jeitos: expandindo as fronteiras
// (Obras, pago pelo tesouro: a borda avança 5 blocos) ou anexando uma vila livre sua que fique perto.
// Cada ganho fica anotado em G.claims e é refeito na mesma ordem ao carregar o jogo.
const BORDER_MAX = 8;
const Borders = {
  lvl(ci) { return (G.civs[ci] && G.civs[ci].border) || 0; },
  STEP: 5, // blocos que a fronteira avança a cada expansão
  cost(ci) { const l = this.lvl(ci); return { gold: 250 + 150 * l, wood: 30 + 10 * l, stone: 30 + 10 * l }; },
  // blocos que um ganho daria (sem gravar nada)
  count(cx, cy, r) {
    let n = 0;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (!World.inb(x, y) || U.dist(x, y, cx, cy) > r) continue;
      const i = World.idx(x, y); if (World.terr[i] < 0 && World.tiles[i] !== T.DEEP) n++;
    }
    return n;
  },
  claim(ci, cx, cy, r, quiet) {
    let n = 0;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (!World.inb(x, y) || U.dist(x, y, cx, cy) > r) continue;
      const i = World.idx(x, y); if (World.terr[i] < 0 && World.tiles[i] !== T.DEEP) { World.terr[i] = ci; n++; }
    }
    if (!quiet) (G.claims = G.claims || []).push({ ci, x: cx, y: cy, r });
    World.chunks = new Map(); if (World.mini) World.buildMinimap();
    return n;
  },
  // a borda do reino avança d blocos sobre a terra selvagem (sem atravessar o mar aberto nem outros reinos)
  growTiles(ci, d) {
    const W = WORLD_W, N = W * WORLD_H, dist = new Int16Array(N).fill(-1), q = new Int32Array(N);
    let h = 0, t = 0;
    for (let i = 0; i < N; i++) if (World.terr[i] === ci) { dist[i] = 0; q[t++] = i; }
    const out = [];
    while (h < t) {
      const i = q[h++], x = i % W, y = (i / W) | 0;
      if (dist[i] >= d) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= WORLD_H) continue;
        const j = ny * W + nx;
        if (dist[j] >= 0 || World.terr[j] >= 0 || World.tiles[j] === T.DEEP) continue;
        dist[j] = dist[i] + 1; q[t++] = j; out.push(j);
      }
    }
    return out;
  },
  grow(ci, d, quiet) {
    const tiles = this.growTiles(ci, d);
    for (const i of tiles) World.terr[i] = ci;
    if (!quiet) (G.claims = G.claims || []).push({ ci, grow: d });
    World.chunks = new Map(); if (World.mini) World.buildMinimap();
    return tiles.length;
  },
  restore() { for (const c of G.claims || []) if (G.civs[c.ci]) { if (c.grow) this.grow(c.ci, c.grow, true); else this.claim(c.ci, c.x, c.y, c.r, true); } },
  // Obras → Expandir fronteiras: a borda avança 5 blocos, só sobre a terra selvagem
  nextGain(ci) { return this.lvl(ci) < BORDER_MAX ? this.growTiles(ci, this.STEP).length : 0; },
  expand(ci) {
    const c = G.civs[ci], cp = World.capitals[ci], cost = this.cost(ci);
    if (!c || c.ruler !== 'player' || !cp || this.lvl(ci) >= BORDER_MAX) return;
    const have = r => r === 'gold' ? c.treasury : (c.stock[r] || 0);
    if (!Object.entries(cost).every(([r, n]) => have(r) >= n)) { UI.msg('O tesouro ou os armazéns do reino não têm o suficiente.', 'bad'); return; }
    if (!this.nextGain(ci)) { UI.msg('Não há terra selvagem na fronteira do reino para tomar.', 'bad'); return; }
    for (const [r, n] of Object.entries(cost)) { if (r === 'gold') c.treasury -= n; else c.stock[r] -= n; }
    c.border = this.lvl(ci) + 1;
    const n = this.grow(ci, this.STEP);
    UI.banner(`🗺️ Fronteiras de ${CIV_DEFS[ci].short} ampliadas!`);
    UI.msg(`A fronteira avançou ${this.STEP} blocos: o reino tomou ${n} blocos de terra selvagem.`, 'gold');
    Diplo.chronicle(`🗺️ O ${CIV_DEFS[ci].name} ampliou as suas fronteiras sobre as terras selvagens.`);
  },
  // vila livre sua perto de um reino seu: qual reino pode recebê-la (o que tem mais terra por perto)
  annexTarget(vi) {
    const v = World.villages[vi];
    if (!v || !v.free || v.lord !== 'player') return -1;
    const near = {};
    for (let y = v.y - 26; y <= v.y + 26; y++) for (let x = v.x - 26; x <= v.x + 26; x++) {
      if (!World.inb(x, y)) continue;
      const t = World.terr[World.idx(x, y)];
      if (t >= 0 && G.civs[t] && G.civs[t].ruler === 'player') near[t] = (near[t] || 0) + 1;
    }
    let best = -1, bn = 0;
    for (const k in near) if (near[k] > bn) { bn = near[k]; best = +k; }
    return best;
  },
  annex(vi) {
    const ci = this.annexTarget(vi), v = World.villages[vi];
    if (ci < 0) { UI.msg('A vila precisa ficar perto das terras de um reino seu.', 'bad'); return; }
    v.free = false; v.civ = ci;
    const spec = (G.founded || []).find(x => x.x === v.x && x.y === v.y); if (spec) { spec.free = false; spec.civ = ci; }
    for (const p of People.residents(vi)) p.civ = ci;
    Towns.syncOwners();
    const n = this.claim(ci, v.x, v.y, 17);
    UI.banner(`👑 ${v.name} agora é do ${CIV_DEFS[ci].name}!`);
    UI.msg(`${v.name} entrou no reino com ${n} blocos de terra em volta. Você continua chefe da vila.`, 'gold');
    Diplo.chronicle(`👑 ${v.name} foi anexada ao ${CIV_DEFS[ci].name}.`);
  },
};
