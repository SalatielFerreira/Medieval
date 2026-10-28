'use strict';
// Integridade do mundo: regras que nunca podem quebrar, conferidas onde elas mudam e, por segurança, todo mês.
//  • Um só rei por reino: quem assume o trono tira o título dos outros "reis" vivos daquele reino (viram cavaleiros).
//  • Governador que morre deixa o cargo na hora: a família assume interinamente e há eleição no mês seguinte.
//  • Tesouro nunca negativo: o rombo vira dívida com o banco do reino (e conta para a crise).
//  • Todo reino tem banco (a não ser que o rei tenha demolido): se sumir, volta perto do castelo.
// E caminhos leves: viajantes e caravanas seguem as estradas com uma busca só pelos blocos de estrada, em vez do
// cálculo de rota no mapa inteiro (que travava um quadro).

const Integrity = {
  // ---------------------------------------------------------------- um só rei por reino
  oneKing(ci) {
    const c = G.civs[ci]; if (!c) return;
    const keep = c.ruler === 'player' ? null : c.rulerId;
    for (const p of G.people) if (p.alive && p.rank === 'ruler' && p.civ === ci && p.id !== keep) { p.rank = 'knight'; if (p.home && p.home.type === 'castle' && p.home.civ === ci && keep === null) p.home = { type: 'castle', civ: ci }; }
    if (c.ruler === 'npc') { const k = keep !== null && keep !== undefined ? G.people[keep] : null; if (!k || !k.alive) this.crown(c); }
  },
  // reino sem rei vivo: o herdeiro, o cônjuge, um cavaleiro ou alguém novo assume
  crown(c) {
    const ci = c.id, old = c.rulerId !== null && c.rulerId !== undefined ? G.people[c.rulerId] : null;
    let next = old ? old.children.map(id => G.people[id]).find(q => q && q.alive && q.age >= 16) : null;
    if (!next && old && old.spouse !== null && old.spouse !== 'player') { const s = G.people[old.spouse]; if (s && s.alive) next = s; }
    if (!next) next = G.people.find(q => q.alive && q.rank === 'knight' && q.civ === ci);
    if (!next) next = People.create({ rank: 'ruler', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(30, 50) });
    Succession.seat(c, next, 'ruler');
  },
  // ---------------------------------------------------------------- tesouro nunca negativo
  treasury() {
    for (const c of G.civs) {
      if (!(typeof c.treasury === 'number' && isFinite(c.treasury))) c.treasury = 0;
      if (c.treasury < 0) { const d = -c.treasury; c.treasury = 0; if (typeof Bank !== 'undefined') Bank.K(c.id).debt += Math.round(d); }
    }
    if (!(typeof P.gold === 'number' && isFinite(P.gold))) P.gold = 0; else if (P.gold < 0) P.gold = 0;
  },
  // ---------------------------------------------------------------- governadores
  chiefs() {
    World.villages.forEach((v, vi) => {
      if (v.chief === undefined || v.chief === 'player') return;
      const p = G.people[v.chief];
      if (!p || !p.alive) this.vacate(vi);
    });
  },
  vacate(vi) {
    const v = World.villages[vi]; if (!v) return;
    v.chief = undefined; delete v.elected;
    if (typeof Society !== 'undefined') { const E = Society.E(vi); E.next = Math.min(E.next, G.day + 1); }
    Families.refresh(); // a família mais forte da vila assume interinamente
  },
  // ---------------------------------------------------------------- todo mês, por segurança
  monthTick() {
    for (const c of G.civs) this.oneKing(c.id);
    this.chiefs(); this.treasury();
    if (typeof Bank !== 'undefined') { const miss = G.civs.some(c => !Bank.has(c.id) && !Bank.K(c.id).gone && !(Urban.E().added || []).some(a => a.type === 'bank' && a.civ === c.id)); if (miss) Bank.place(); }
  },
};

// caminho só pelas estradas (e pontes), de perto de A até perto de B; null se não houver estrada ligando
World.roadPath = function (ax, ay, bx, by, maxNodes) {
  const isRoad = i => { const t = World.tiles[i]; return t === T.ROAD || t === T.BRIDGE; };
  const near = (x, y) => { let best = -1, bd = 1e9; for (let r = 0; r <= 10 && best < 0; r++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) { if (Math.max(Math.abs(j), Math.abs(k)) !== r) continue; const tx = x + k, ty = y + j; if (!World.inb(tx, ty)) continue; const i = World.idx(tx, ty); if (isRoad(i)) { const d = j * j + k * k; if (d < bd) { bd = d; best = i; } } } return best; };
  const s = near(ax, ay), e = near(bx, by); if (s < 0 || e < 0) return null;
  // listas do tamanho do mapa guardadas entre as buscas; a "marca" da busca atual diz quem já foi visto (sem limpar tudo)
  const N = WORLD_W * WORLD_H, B = World._rp && World._rp.n === N ? World._rp : (World._rp = { n: N, prev: new Int32Array(N), seen: new Uint32Array(N), q: new Int32Array(N), mark: 0 });
  if (++B.mark >= 0xffffffff) { B.seen.fill(0); B.mark = 1; }
  const prev = B.prev, seen = B.seen, q = B.q, mk = B.mark, lim = maxNodes || 60000, tiles = World.tiles, road = T.ROAD, bridge = T.BRIDGE;
  seen[s] = mk; prev[s] = -1; q[0] = s; let qn = 1, found = s === e;
  for (let h = 0; h < qn && !found; h++) {
    if (qn > lim) return null;
    const i = q[h], x = i % WORLD_W, y = (i / WORLD_W) | 0;
    for (let d = 0; d < 8; d++) {
      const nx = x + RP_DX[d], ny = y + RP_DY[d]; if (nx < 0 || ny < 0 || nx >= WORLD_W || ny >= WORLD_H) continue;
      const n = ny * WORLD_W + nx; if (seen[n] === mk) continue; const t = tiles[n]; if (t !== road && t !== bridge) continue;
      seen[n] = mk; prev[n] = i; if (n === e) { found = true; break; } q[qn++] = n;
    }
  }
  if (!found) return null;
  const out = []; for (let i = e; i !== -1; i = prev[i]) out.push(i); // do fim para o começo (como World.findPath)
  return out;
};
const RP_DX = [1, -1, 0, 0, 1, 1, -1, -1], RP_DY = [0, 0, 1, -1, 1, -1, 1, -1];

{
  // quem assume o trono tira o título dos outros
  const se0 = Succession.seat.bind(Succession);
  Succession.seat = function (c, p, rank) { const r = se0(c, p, rank); if (c && rank === 'ruler') { if (p && c.ruler !== 'player') p.civ = c.id; // o rei passa a ser do reino que herdou (um herdeiro casado fora era de outro)
 for (const q of G.people) if (q !== p && q.alive && q.rank === 'ruler' && q.civ === c.id) q.rank = 'knight'; } return r; };
  const su0 = People.succeed.bind(People);
  People.succeed = function (ci, heir, old) { const was = heir ? heir.civ : -1, r = su0(ci, heir, old), c = G.civs[ci], k = c && c.ruler === 'npc' ? G.people[c.rulerId] : null; if (k) k.civ = ci; Integrity.oneKing(ci); if (was >= 0 && was !== ci && G.civs[was]) Integrity.oneKing(was); return r; };
  const br0 = Game.becomeRuler.bind(Game);
  Game.becomeRuler = function (ci, how) { const r = br0(ci, how); Integrity.oneKing(ci); return r; };
  for (const [o, n] of [[Game, 'rebellion'], [Game, 'conquer']]) { const f = o[n]; if (typeof f !== 'function') continue; o[n] = function (...a) { const r = f.apply(this, a); const c = a[0] && typeof a[0] === 'object' ? a[0] : G.civs[a[0]]; if (c) Integrity.oneKing(c.id); return r; }; }
  // governador que morre deixa o cargo na hora
  const die0 = People.die.bind(People);
  People.die = function (p, cause) {
    const was = p && p.alive, vis = was ? World.villages.map((v, i) => v.chief === p.id ? i : -1).filter(i => i >= 0) : [];
    const r = die0(p, cause);
    for (const vi of vis) Integrity.vacate(vi);
    // rei da IA que morre: se ninguém assumiu, o herdeiro (ou um cavaleiro) assume na hora
    // (logo depois de quem chamou terminar: num golpe, o golpista senta no trono logo após a morte do rei)
    if (was && p.rank === 'ruler') { const c = G.civs[p.civ]; queueMicrotask(() => { if (c && G.civs[c.id] === c && c.ruler === 'npc' && !c.dead && c.rulerId === p.id && !p.alive) Integrity.crown(c); }); }
    return r;
  };
  // tesouro conferido depois de cada pedaço do mês e no fim da virada
  const rt0 = Perf.runTask.bind(Perf);
  Perf.runTask = function (t) { rt0(t); Integrity.treasury(); };
  const et0 = Game.econTick.bind(Game);
  Game.econTick = function () { const r = et0(); Integrity.treasury(); return r; };
  const sn0 = Game.snapshot.bind(Game);
  Game.snapshot = function (...a) { if (typeof Bank !== 'undefined') Bank.syncCamps(); return sn0(...a); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Integrity.monthTick(); };
  Perf.defer(Integrity, 'monthTick', 'Integrity.monthTick');
  // fundar vila e construir negócio das famílias viram pedaços próprios do mês (eram os mais pesados)
  const fo0 = Families.found.bind(Families);
  Families.found = function (f) { if (Perf.slicing) { Perf.queue.push(Object.assign(() => fo0(f), { label: 'Families.found' })); return true; } return fo0(f); };
  const bb0 = Families.buildBiz.bind(Families);
  Families.buildBiz = function (f) { if (Perf.slicing) { Perf.queue.push(Object.assign(() => bb0(f), { label: 'Families.buildBiz' })); return; } return bb0(f); };
  // caminhos: estrada primeiro (leve); o cálculo completo só se não houver estrada, e nunca durante um quadro do jogo
  // viajantes: caminho pela estrada (as caravanas usam o mesmo, na rota guardada do perf.js)
  Travel.route = function (a, b) {
    const k = a < b ? a + ':' + b : b + ':' + a, r = this.routes.get(k);
    if (r) return r.path ? (a < b ? r.path : r.rev) : null;
    const A = World.villages[Math.min(a, b)], B = World.villages[Math.max(a, b)];
    let path = A && B ? World.roadPath(A.x, A.y, B.x, B.y, 30000) : null;
    if (path && path.length > 500) path = null;
    if (path) path.reverse();
    this.routes.set(k, { path, rev: path ? path.slice().reverse() : null });
    return path ? (a < b ? path : this.routes.get(k).rev) : null;
  };
}
