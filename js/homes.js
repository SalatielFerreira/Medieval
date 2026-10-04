'use strict';
// Casas dos moradores: cada família (o casal e os filhos pequenos) ou adulto solteiro tem a sua casa para dormir.
// Quem não tem casa ocupa uma livre da vila ou constrói uma nova perto dela: a obra leva alguns dias, aparece no
// mapa com andaime e os moradores trabalham nela durante o dia. As casas construídas ficam no jogo salvo.

const HOUSE_BUILD_DAYS = 1; // 5 minutos reais
const HOUSE_BUILDS_PER_VILLAGE = 2; // obras ao mesmo tempo em cada vila

const Homes = {
  H() { return G.homes || (G.homes = {}); },          // família -> chave da casa
  B() { return G.npcHouses || (G.npcHouses = []); },  // casas construídas pelos moradores
  key(s) { return s.hid || s.okey; },
  // "família" para morar junto: o casal (pelo menor número) ou, para as crianças, a família dos pais
  household(p, depth) {
    if (!p || !p.home || p.home.type !== 'village') return null;
    const vi = p.home.idx, same = q => q && q.alive && q.home && q.home.type === 'village' && q.home.idx === vi && !q.capanga;
    if ((p.age < 16 || p.rank === 'child') && (depth || 0) < 3) for (const id of p.parents || []) { const q = G.people[id]; if (same(q)) return this.household(q, (depth || 0) + 1); }
    if (typeof p.spouse === 'number' && same(G.people[p.spouse])) return Math.min(p.id, p.spouse);
    return p.id;
  },
  // chave -> casa (ou obra), refeito só quando as construções mudam
  map() {
    const ver = World.structs.length + ':' + (this.ver || 0);
    if (this._m && this._mv === ver) return this._m;
    const m = new Map();
    for (const s of World.structs) if ((s.type === 'vhouse' || s.type === 'vbuild') && !s.removed) m.set(this.key(s), s);
    this._m = m; this._mv = ver;
    return m;
  },
  touch() { this.ver = (this.ver || 0) + 1; },
  // casa onde a pessoa dorme (null: ainda não tem, está em obras ou a casa está em ruínas)
  houseOf(p) {
    const hh = this.household(p);
    if (hh === null) return null;
    const k = this.H()[hh];
    if (k === undefined) return null;
    const s = this.map().get(k);
    return s && s.type === 'vhouse' && !s.hidden && !s.ruined && !s.removed ? s : null;
  },
  buildOf(p) {
    const hh = this.household(p), k = hh !== null ? this.H()[hh] : undefined;
    const s = k !== undefined ? this.map().get(k) : null;
    return s && s.type === 'vbuild' && !s.removed ? s : null;
  },
  status(p) { return this.houseOf(p) ? 'tem casa própria' : this.buildOf(p) ? 'construindo a casa' : 'ainda sem casa'; },
  // famílias de cada vila (só quem mora na vila de fato)
  households() {
    const out = new Map();
    for (const p of G.people) {
      if (!p.alive || !p.home || p.home.type !== 'village' || p.capanga || (p.job !== undefined && p.job !== null) || p.lost) continue;
      const hh = this.household(p);
      if (!out.has(hh)) out.set(hh, { vi: p.home.idx, adult: false, fam: p.fam, n: 0 });
      const h = out.get(hh); h.n++;
      if (p.age >= 16) h.adult = true;
    }
    return out;
  },
  // um dia: libera casas sem dono, ocupa casas livres, começa obras e avança as que estão em andamento
  dayTick(advance) {
    if (G.dungeon) return;
    const H = this.H(), m = this.map(), hhs = this.households();
    for (const hh of Object.keys(H)) {
      const h = hhs.get(+hh), s = m.get(H[hh]);
      if (!h || !s || s.removed || (s.village !== undefined && s.village !== h.vi)) delete H[hh];
    }
    const owned = new Set(Object.values(H));
    const building = {};
    for (const s of m.values()) if (s.type === 'vbuild') building[s.village] = (building[s.village] || 0) + 1;
    for (const [hh, h] of hhs) {
      if (H[hh] !== undefined || !h.adult) continue;
      // casa livre (ou obra abandonada) na mesma vila
      let free = null;
      for (const s of m.values()) if (s.village === h.vi && !owned.has(this.key(s)) && !s.hidden && !s.ruined && !s.removed) { free = s; break; }
      if (free) { H[hh] = this.key(free); owned.add(H[hh]); continue; }
      if ((building[h.vi] || 0) >= HOUSE_BUILDS_PER_VILLAGE) continue;
      const s = this.startBuild(h.vi, h.fam);
      if (s) { H[hh] = this.key(s); owned.add(H[hh]); building[h.vi] = (building[h.vi] || 0) + 1; }
    }
    if (!advance) return;
    for (const e of this.B()) {
      if (e.done) continue;
      e.progress = Math.min(1, e.progress + 1 / HOUSE_BUILD_DAYS);
      const s = this.map().get(e.id);
      if (s) s.progress = e.progress;
      if (e.progress >= 1) this.finish(e, s);
    }
  },
  // escolhe um lugar livre perto da vila e abre a obra
  startBuild(vi, famId) {
    const v = World.villages[vi];
    if (!v) return null;
    for (let r = 5; r <= 30; r++) for (let k = 0; k < 28 + r; k++) { // vila cheia: procura mais longe
      const a = k / (28 + r) * Math.PI * 2 + vi * 0.7 + r * 0.37;
      const x = Math.round(v.x + Math.cos(a) * r) - 1, y = Math.round(v.y + Math.sin(a) * r * 0.8) - 1;
      if (!World.areaOk(x - 1, y - 1, 4, 4) || !World.areaFree(x - 1, y - 1, 4, 4) || Towns.onRoad(x, y, 2, 2)) continue;
      if (U.dist(x + 1, y + 1, P.x / TILE, P.y / TILE) < 3) continue;
      // árvores e pedras no lugar da casa são retiradas
      for (let j = y; j < y + 2; j++) for (let i = x; i < x + 2; i++) { const t = World.idx(i, j); World.obj[t] = 0; }
      World.regrow = World.regrow.filter(q => !(q.i % WORLD_W >= x && q.i % WORLD_W < x + 2 && ((q.i / WORLD_W) | 0) >= y && ((q.i / WORLD_W) | 0) < y + 2));
      G.npcHouseSeq = (G.npcHouseSeq || 0) + 1;
      const e = { id: 'nh' + G.npcHouseSeq, x, y, vi, progress: 0, done: false };
      this.B().push(e);
      const s = this.make(e);
      const f = Families.get(famId);
      if (f && f.wealth >= 40) f.wealth -= 40;
      World.chunks.clear();
      if (U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 40 && f) Game.note(`🔨 A ${Families.name(f)} começou a construir uma casa em ${v.name}.`);
      return s;
    }
    return null;
  },
  make(e) {
    const v = World.villages[e.vi];
    const s = World.addStruct(e.done ? 'vhouse' : 'vbuild', e.x, e.y, 2, 2, v ? v.civ : 0, { village: e.vi, hid: e.id, okey: 'nh:' + e.id, npcBuilt: true, progress: e.progress });
    this.touch();
    return s;
  },
  finish(e, s) {
    e.done = true; e.progress = 1;
    if (s) { s.type = 'vhouse'; s.blocks = true; s.progress = 1; }
    this.touch();
    const v = World.villages[e.vi];
    if (v) { Towns.show(v); if (U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 40) Game.note(`🏠 Uma casa nova ficou pronta em ${v.name}.`); }
  },
  // jogo salvo: recria as casas construídas pelos moradores
  restore() { for (const e of this.B()) this.make(e); },
  // o chefe ou o rei mudou ou demoliu uma casa construída por um morador
  moved(s) { const e = this.B().find(q => q.id === s.hid); if (e) { e.x = s.x; e.y = s.y; } },
  removed(s) {
    const b = this.B(), i = b.findIndex(q => q.id === s.hid);
    if (i >= 0) b.splice(i, 1);
    const H = this.H(), k = this.key(s);
    for (const hh of Object.keys(H)) if (H[hh] === k) delete H[hh];
    this.touch();
  },
  // moradores ajudam na obra da própria casa durante o dia
  work(e, b, dt, sp) {
    const tx = (b.x + 1) * TILE, ty = (b.y + 2.6) * TILE;
    const d = U.dist(e.x, e.y, tx, ty);
    if (d > 26) { Routine.go(e, tx, ty, Math.max(sp, 34), dt); return true; }
    e.dir = tx < e.x ? -1 : 1; e.aim = Math.atan2(ty - 40 - e.y, tx - e.x);
    e.bt = (e.bt || 0) - dt;
    if (e.bt <= 0) {
      e.bt = U.rnd(0.9, 1.4); e.swing = 0.28;
      if (U.dist(e.x, e.y, P.x, P.y) < 9 * TILE) { Sound.play('chop', { vol: 0.25 }); Game.burst(tx, ty - 30, '#c9a978', 3); }
    }
    return true;
  },
};
