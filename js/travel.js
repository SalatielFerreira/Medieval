'use strict';
// Viajantes: os moradores frequentam outras vilas e outros reinos. Saem para comprar o que falta na vila deles, visitar
// parentes e amigos, ver os Jogos, ir à feira, procurar trabalho ou só passear; andam pelas estradas (você os vê no
// caminho quando está perto) e voltam com compras, amigos novos, às vezes um amor (e se mudam), às vezes famosos no
// lugar que visitaram.

const TRAVEL_WHY = { compras: ['🛒', 'fazer compras'], visita: ['👋', 'visitar parentes e amigos'], jogos: ['🏅', 'assistir aos Jogos'], feira: ['🎪', 'ir à feira'], trabalho: ['🔨', 'procurar trabalho'], passeio: ['🧳', 'passear'] };
const TRAVEL_GOODS = ['um tecido fino', 'especiarias', 'uma faca nova', 'sementes boas', 'um chapéu da moda', 'vinho do sul', 'um livro', 'mel', 'botas de couro', 'um colar de contas'];

const Travel = {
  routes: new Map(), routeBusy: 0, shown: new Set(),
  // mais gente viaja: adultos sem cargo que prenda em casa
  canTravel(p) {
    if (!p || !p.alive || p.trip || !p.home || p.home.type !== 'village' || !World.villages[p.home.idx]) return false;
    if (G.day - (p.tripBack === undefined ? -99 : p.tripBack) < 3 || p.age < 16 || p.age > 70) return false;
    if (p.capanga || p.kin || p.council || p.port || p.shop || p.spouse === 'player' || (p.job !== undefined && p.job !== null) || p.hostile || p.jail > G.day) return false;
    if (Families.isChief(p) || People.isCourt(p)) return false;
    return true;
  },
  // para onde e por quê
  plan(p) {
    const home = World.villages[p.home.idx], civ = home.civ, ok = vi => vi !== p.home.idx && World.villages[vi] && !World.villages[vi].free && Trips.peaceful(civ, World.villages[vi].civ);
    const near = Trips.destinations(p).map(x => x.vi).filter(ok);
    const S = typeof Games !== 'undefined' ? Games.S() : null;
    if (S && S.on && Math.random() < 0.5) { const L = World.villages.map((v, i) => i).filter(i => ok(i) && World.villages[i].civ === S.host); if (L.length) return { vi: U.pick(L), why: 'jogos', months: 1 }; }
    const fair = typeof Commerce !== 'undefined' ? Commerce.fair() : null;
    if (fair && Math.random() < 0.3) { const L = World.villages.map((v, i) => i).filter(i => ok(i) && World.villages[i].civ === fair.ci); if (L.length) return { vi: U.pick(L), why: 'feira', months: 1 }; }
    const kin = [...(p.parents || []), ...(p.children || []), ...(p.pals || [])].map(id => G.people[id]).filter(q => q && q.alive && q.home && q.home.type === 'village' && ok(q.home.idx));
    if (kin.length && Math.random() < 0.5) return { vi: U.pick(kin).home.idx, why: 'visita', months: U.rint(1, 2) };
    if (!near.length) return null;
    const lack = vi => { const has = new Set(Shops.list(vi).map(s => s.type)); return near.find(j => Shops.list(j).some(s => !has.has(s.type))); };
    const r = Math.random();
    if (r < 0.35) { const j = lack(p.home.idx); if (j !== undefined) return { vi: j, why: 'compras', months: 1 }; }
    if (r < 0.55 && ['peasant', 'wanderer', 'beggar'].includes(p.rank)) { const j = near.slice().sort((a, b) => (World.villages[b].level || 1) - (World.villages[a].level || 1))[0]; return { vi: j, why: 'trabalho', months: U.rint(1, 3) }; }
    return { vi: near[Math.min(near.length - 1, Math.floor(Math.random() * Math.min(5, near.length)))], why: 'passeio', months: U.rint(1, 2) };
  },
  depart() {
    const S = typeof Games !== 'undefined' ? Games.S() : null, rate = S && S.on ? 0.06 : 0.025;
    let n = 0;
    for (const p of G.people) {
      if (n >= 12) break;
      if (!this.canTravel(p) || Math.random() > rate) continue;
      const pl = this.plan(p); if (!pl || pl.vi === undefined) continue;
      Trips.start(p, pl.vi, pl.months); p.trip.why = pl.why; p.trip.from = p.home.idx; n++;
    }
  },
  // a volta: compras, amizades, amor e fama
  back(p) {
    const t = p.trip; if (!t) return;
    const dest = World.villages[t.vi], home = World.villages[p.home.idx]; if (!dest) return;
    const why = t.why || 'passeio';
    if (why === 'compras' && People.purse(p) >= 20) { p.purse -= U.rint(10, 30); Rumors.atV(p.home.idx, `${p.name} voltou de ${dest.name} com ${U.pick(TRAVEL_GOODS)}.`); }
    if (why === 'trabalho') p.purse = People.purse(p) + U.rint(20, 60);
    const locals = People.residents(t.vi).filter(q => q.age >= 16 && q !== p);
    const pal = U.pick(locals);
    if (pal) { p.pals = (p.pals || []).filter(id => id !== pal.id).concat(pal.id).slice(-6); pal.pals = (pal.pals || []).filter(id => id !== p.id).concat(p.id).slice(-6); }
    // fama no lugar visitado
    const gain = (p.hero ? 6 : ['smith', 'innkeeper', 'merchant', 'priest', 'knight', 'bard'].includes(p.rank) ? 3 : 1) + (why === 'jogos' ? 2 : 0) + (why === 'trabalho' ? 2 : 0);
    p.fameAt = p.fameAt || {}; p.fameAt[t.vi] = (p.fameAt[t.vi] || 0) + gain;
    let moved = false;
    if (p.fameAt[t.vi] >= 10 && p.famousAt !== t.vi) {
      p.famousAt = t.vi; Rumors.atV(t.vi, `${p.name}, de ${home ? home.name : 'longe'}, ficou famoso(a) em ${dest.name}.`);
      if (typeof Politics !== 'undefined') Politics.addDeed(t.vi, p.id, 3);
      if (Math.random() < 0.3 && People.residents(t.vi).length < Families.vcap(dest)) { p.home = { type: 'village', idx: t.vi }; moved = true; Rumors.atV(t.vi, `${p.name} foi convidado(a) a morar em ${dest.name} e aceitou.`); }
    }
    // um amor na viagem (às vezes muda de vila)
    if (!moved && pal && p.spouse === null && pal.spouse === null && pal.sex !== p.sex && Math.abs(pal.age - p.age) < 12 && Math.random() < 0.04) {
      p.spouse = pal.id; pal.spouse = p.id; Families.wed(p, pal); p.home = { type: 'village', idx: t.vi }; moved = true;
      Rumors.atV(t.vi, `${p.name} veio de ${home ? home.name : 'longe'}, se apaixonou por ${pal.name} e os dois se casaram!`);
      if (p.met || pal.met) UI.msg(`💍 ${p.name} se apaixonou por ${pal.name} na viagem a ${dest.name} e os dois se casaram.`);
    }
    if (moved && typeof Perf !== 'undefined') Perf.dirty();
  },
  // ---------------------------------------------------------------- na estrada
  route(a, b) {
    const k = a < b ? a + ':' + b : b + ':' + a, r = this.routes.get(k);
    if (r) return r.path ? (a < b ? r.path : r.rev) : null;
    if (performance.now() < this.routeBusy) return undefined; // uma rota nova a cada 3 segundos, no máximo
    this.routeBusy = performance.now() + 3000;
    const A = World.villages[Math.min(a, b)], B = World.villages[Math.max(a, b)];
    let path = null; try { path = World.findPath(A.x, A.y + 3, B.x, B.y + 3); } catch (e) { path = null; }
    if (path && path.length > 400) path = null;
    if (path) path.reverse();
    this.routes.set(k, { path, rev: path ? path.slice().reverse() : null });
    return path ? (a < b ? path : this.routes.get(k).rev) : null;
  },
  segDist(px, py, a, b) { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1, t = U.clamp(((px - a.x) * dx + (py - a.y) * dy) / l, 0, 1); return U.dist(px, py, a.x + t * dx, a.y + t * dy); },
  update(dt) {
    this.t = (this.t || 0) - dt;
    const live = [...this.shown].map(id => G.people[id]).filter(Boolean);
    // quem está aparecendo anda pela estrada
    for (const p of live) {
      const e = G.spawned.get(p.id);
      if (!e || e.dead || !e.traveler) { this.shown.delete(p.id); continue; }
      const goal = this.goal(p, e.route);
      if (!goal || U.dist(P.x, P.y, e.x, e.y) > 34 * TILE) { e.dead = true; G.spawned.delete(p.id); this.shown.delete(p.id); continue; }
      const dx = goal.x - e.x, dy = goal.y - e.y, d = Math.hypot(dx, dy), sp = 70 * dt;
      if (d > 1) { e.x += dx / d * Math.min(sp, d); e.y += dy / d * Math.min(sp, d); e.dir = dx < 0 ? -1 : 1; e.moving = true; e.anim = (e.anim || 0) + dt * 8; }
      e.target = null;
    }
    if (this.t > 0) return; this.t = 0.6;
    if (G.state !== 'play' || G.place || G.dungeon || G.siege || this.shown.size >= 6) return;
    const px = P.x / TILE, py = P.y / TILE;
    for (const p of G.people) {
      if (this.shown.size >= 6) break;
      if (!p.alive || !p.trip || p.trip.from === undefined || this.shown.has(p.id)) continue;
      const out = G.day === p.trip.since, back = G.day === p.trip.until - 1; if (!out && !back) continue;
      const a = World.villages[out ? p.trip.from : p.trip.vi], b = World.villages[out ? p.trip.vi : p.trip.from]; if (!a || !b) continue;
      if (this.segDist(px, py, a, b) > 26) continue;
      const route = this.route(out ? p.trip.from : p.trip.vi, out ? p.trip.vi : p.trip.from); if (!route) continue;
      const at = this.goal(p, route); if (!at || U.dist(P.x, P.y, at.x, at.y) > 24 * TILE) continue;
      const old = G.spawned.get(p.id); if (old && !old.dead) continue;
      const e = Game.spawn('villager', at.x, at.y, { civ: World.villages[p.trip.from] ? World.villages[p.trip.from].civ : -1, npc: p, leash: 999 });
      e.traveler = true; e.still = true; e.route = route; G.spawned.set(p.id, e); this.shown.add(p.id);
    }
  },
  // onde o viajante está agora: o caminho é feito ao longo do mês
  goal(p, route) {
    if (!route || !route.length || !p.trip) return null;
    const k = Math.min(route.length - 1, Math.floor(U.clamp(G.time / DAY_LEN, 0, 1) * route.length)), i = route[k];
    return { x: (i % WORLD_W + 0.5) * TILE, y: (Math.floor(i / WORLD_W) + 0.8) * TILE };
  },
};

{
  const mt0 = Trips.monthTick.bind(Trips);
  Trips.monthTick = function () { mt0(); Travel.depart(); };
  const en0 = Trips.end.bind(Trips);
  Trips.end = function (p, war) { if (!war) { try { Travel.back(p); } catch (e) { console.warn('viagem', e); } } Travel.shown.delete(p.id); return en0(p, war); };
  // na conversa: para onde vai, e onde é famoso
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) {
    const out = ch0(p);
    if (p.trip && World.villages[p.trip.vi]) { const w = TRAVEL_WHY[p.trip.why || 'passeio']; out.push(`<span>${w[0]} Viajando a ${UI.esc(World.villages[p.trip.vi].name)} para ${w[1]}</span>`); }
    if (p.famousAt !== undefined && World.villages[p.famousAt]) out.push(`<span class="tag" style="background:#6a4a1a">⭐ Famoso(a) em ${UI.esc(World.villages[p.famousAt].name)}</span>`);
    const pals = (p.pals || []).map(id => G.people[id]).filter(q => q && q.alive && q.home && q.home.type === 'village' && q.home.idx !== (p.home && p.home.idx));
    if (pals.length) out.push(`<span>🧭 Amigos em ${UI.esc([...new Set(pals.map(q => World.villages[q.home.idx] && World.villages[q.home.idx].name).filter(Boolean))].slice(0, 3).join(', '))}</span>`);
    return out;
  };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); Travel.update(dt); };
  const ld0 = Game.load.bind(Game);
  Game.load = function (...a) { Travel.shown.clear(); Travel.routes.clear(); return ld0(...a); };
}
