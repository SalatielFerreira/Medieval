'use strict';
// Desempenho: a virada do mês não pode travar o jogo.
//  • Cores: cada cor "#rrggbb" é convertida uma vez só (o minimapa e o desenho pedem a mesma cor milhares de vezes).
//  • Famílias: um índice família → pessoas, refeito quando alguém nasce, casa ou entra numa casa (e a cada quadro, por
//    segurança). Antes, cada consulta percorria todas as pessoas do mundo.
//  • Minimapa: durante o jogo ele é refeito aos poucos (alguns milissegundos por quadro) em vez de tudo de uma vez.
//  • Moradores das vilas: um índice vila → pessoas, válido enquanto ninguém nasce, morre ou muda de casa.

{
  const hx = new Map(), h0 = U.hexRgb;
  U.hexRgb = hex => { let v = hx.get(hex); if (!v) { v = h0(hex); if (hx.size < 5000) hx.set(hex, v); } return v; };
}

const Perf = {
  // ---------------------------------------------------------------- famílias
  famIdx: null, famN: -1, famArr: null,
  famIndex() {
    if (this.famIdx && this.famN === G.people.length && this.famArr === G.people) return this.famIdx;
    const m = new Map(); for (const p of G.people) { let a = m.get(p.fam); if (!a) m.set(p.fam, a = []); a.push(p); }
    this.famIdx = m; this.famN = G.people.length; this.famArr = G.people; return m;
  },
  famDirty() { this.famIdx = null; },
  // ---------------------------------------------------------------- moradores
  resIdx: null, resN: -1, resArr: null,
  resIndex() {
    if (this.resIdx && this.resN === G.people.length && this.resArr === G.people) return this.resIdx;
    const m = new Map(); for (const p of G.people) { if (!p.alive || !p.home || p.home.type !== 'village') continue; let a = m.get(p.home.idx); if (!a) m.set(p.home.idx, a = []); a.push(p); }
    this.resIdx = m; this.resN = G.people.length; this.resArr = G.people; return m;
  },
  resDirty() { this.resIdx = null; },
  dirty() { this.famIdx = null; this.resIdx = null; this.memo.clear(); },
  // consultas por vila que percorrem todos os prédios do mundo: o resultado vale até a próxima mudança
  memo: new Map(),
  remember(o, name) {
    const f = o[name]; if (typeof f !== 'function') return;
    o[name] = function (...a) {
      const k = name + '|' + a.map(x => typeof x === 'object' && x !== null ? World.villages.indexOf(x) : x).join(',');
      let v = Perf.memo.get(k);
      if (v === undefined) { v = f.apply(this, a); Perf.memo.set(k, v); }
      return Array.isArray(v) ? v.slice() : v;
    };
  },
  // ---------------------------------------------------------------- minimapa aos poucos
  miniJob: null, miniDirty: false,
  miniStep(budget) {
    if (!this.miniJob) { if (!this.miniDirty || !World.mini) return; this.miniDirty = false; const c = document.createElement('canvas'); c.width = WORLD_W; c.height = WORLD_H; const g = c.getContext('2d'); this.miniJob = { c, g, img: g.createImageData(WORLD_W, WORLD_H), y: 0 }; }
    const J = this.miniJob, t0 = performance.now(), d = J.img.data;
    while (J.y < WORLD_H && performance.now() - t0 < budget) {
      for (let r = 0; r < 2 && J.y < WORLD_H; r++, J.y++) for (let x = 0, i = J.y * WORLD_W; x < WORLD_W; x++, i++) { const [rr, gg, bb] = World.miniColor(i); d[i * 4] = rr; d[i * 4 + 1] = gg; d[i * 4 + 2] = bb; d[i * 4 + 3] = 255; }
    }
    if (J.y >= WORLD_H) { J.g.putImageData(J.img, 0, 0); World.mini = J.c; this.miniJob = null; }
  },
  // ---------------------------------------------------------------- o mês em fatias
  // Durante o jogo, a virada do mês faz na hora só o essencial; os sistemas pesados entram numa fila e rodam nos quadros
  // seguintes, poucos milissegundos por quadro. Testes, dormir e passar meses preso continuam de uma vez.
  queue: [], live: false, slicing: false, notes: null,
  defer(o, name, label) {
    const f = o[name]; if (typeof f !== 'function') return;
    o[name] = function (...a) { if (Perf.slicing) { const t = () => f.apply(o, a); t.label = label || name; Perf.queue.push(t); return; } return f.apply(this, a); };
  },
  runTask(t) {
    const led = Game.ledger; Game.ledger = this.notes || (this.notes = []); this.slicing = true;
    const t0 = performance.now();
    try { t(); } catch (e) { console.warn('mês em fatias', e); } finally { this.slicing = false; Game.ledger = led; const d = performance.now() - t0; if (this.stats) this.stats[t.label] = Math.max(this.stats[t.label] || 0, d); }
  },
  drain(budget) {
    const t0 = performance.now();
    while (this.queue.length && (performance.now() - t0 < budget)) { this.runTask(this.queue.shift()); this.dirty(); }
    if (!this.queue.length && this.month) {
      const M = this.month; this.month = null; const dg = P.gold - M.gold, notes = this.notes || []; this.notes = null;
      if (dg || notes.length) { G.ledger = G.ledger || []; let e = G.ledger.find(x => x.day === M.day); if (!e) { e = { day: M.day, gold: 0, got: [], notes: [] }; G.ledger.unshift(e); if (G.ledger.length > 30) G.ledger.length = 30; } e.gold += dg; e.notes.push(...notes); if (dg) UI.msg(`📒 Fim do mês: ${dg > 0 ? '+' : ''}${dg} 🪙 em negócios, banco, soldos e prêmios (Diário → Contas).`, dg < 0 ? 'bad' : ''); }
    } else if (!this.queue.length && this.notes) this.notes = null;
  },
  flush() { let n = 0; while (this.queue.length && n++ < 500) this.drain(1e9); },
  update(dt) { this.dirty(); this.miniStep(3); if (this.queue.length) this.drain(6); },
};

{
  Families.members = function (f, all) { const a = Perf.famIndex().get(f.id); return a ? a.filter(p => p.fam === f.id && (all || p.alive)) : []; };
  for (const [o, names] of [[Families, ['wed', 'attach', 'settle', 'found', 'makeVillage', 'restore']], [People, ['create', 'die', 'propose', 'appoint', 'dismiss', 'tickYear']]]) {
    for (const n of names) { const f = o[n]; if (typeof f !== 'function') continue; o[n] = function (...a) { Perf.dirty(); try { return f.apply(this, a); } finally { Perf.dirty(); } }; }
  }
  for (const [o, n] of [[World, 'addStruct'], [World, 'removeStruct'], [Urban, 'addCivic'], [Urban, 'doDemolish'], [Urban, 'relocate'], [Families, 'buildBiz'], [Gate, 'monthTick']]) {
    const f = o[n]; if (typeof f !== 'function') continue; o[n] = function (...a) { Perf.memo.clear(); try { return f.apply(this, a); } finally { Perf.memo.clear(); } };
  }
  Perf.remember(VillageEcon, 'parts'); Perf.remember(VillageWorks, 'of'); Perf.remember(VillageWorks, 'capOf'); Perf.remember(Families, 'bizIn'); Perf.remember(Shops, 'list');
  // moradores: o índice dá a lista curta; a condição completa continua sendo conferida em cada pessoa
  People.residents = function (vi) { const a = Perf.resIndex().get(vi); return a ? a.filter(p => p.alive && p.home.type === 'village' && p.home.idx === vi && !p.capanga && (p.job === undefined || p.job === null)) : []; };
  // o minimapa durante o jogo: refeito aos poucos (o primeiro, no carregamento, continua de uma vez)
  const bm0 = World.buildMinimap.bind(World);
  World.buildMinimap = function () {
    if (!this.mini || typeof G === 'undefined' || G.state !== 'play' || Perf.syncMini) { Perf.miniJob = null; return bm0(); }
    Perf.miniDirty = true; Perf.miniJob = null;
  };
  // caravanas: a rota entre dois castelos é a mesma por um bom tempo (as estradas mudam pouco)
  const fp0 = World.findPath.bind(World), routes = Perf.routes = new Map();
  Caravans.dayTick = (dt0 => function (...a) {
    World.findPath = function (ax, ay, bx, by, ...rest) {
      const k = [ax, ay, bx, by].join(','), r = routes.get(k);
      if (r && r.day <= G.day && G.day - r.day < 36) return r.path.slice();
      const rp = World.roadPath ? World.roadPath(ax, ay, bx, by) : null, p = rp && rp.length >= 20 ? rp : fp0(ax, ay, bx, by, ...rest); if (p) routes.set(k, { day: G.day, path: p.slice() }); return p;
    };
    try { return dt0.apply(this, a); } finally { World.findPath = fp0; }
  })(Caravans.dayTick);
  // estradas melhorando: algumas vilas por fatia (o laço pula as vilas que não estão na fatia)
  const ug0 = NpcRoads.upgradeTick.bind(NpcRoads);
  NpcRoads.upgradeTick = function (per) {
    if (!Perf.slicing) return ug0(per);
    const n = World.villages.length;
    for (let k0 = 0; k0 < n; k0 += 6) Perf.queue.push(Object.assign(() => { const all = World.villages, caps = World.capitals, part = new Array(all.length); for (let k = k0; k < Math.min(all.length, k0 + 6); k++) part[k] = all[k]; World.villages = part; World.capitals = []; try { ug0(per); } finally { World.villages = all; World.capitals = caps; } }, { label: 'NpcRoads.upgradeTick(vilas)' }));
    Perf.queue.push(Object.assign(() => { const all = World.villages; World.villages = []; try { ug0(per); } finally { World.villages = all; } }, { label: 'NpcRoads.upgradeTick(castelos)' }));
  };
  const mp0 = World.miniPixel.bind(World);
  World.miniPixel = function (i) { if (Perf.miniJob) Perf.miniDirty = true; return mp0(i); };
  // a cada mês e a cada quadro os índices se refazem (mudanças de casa feitas em qualquer lugar entram na hora certa)
  const et0 = Game.econTick.bind(Game);
  Game.econTick = function () {
    if (!Perf.slicing) Perf.flush(); Perf.dirty();
    const was = Perf.slicing; Perf.slicing = was || Perf.live; let r; try { r = et0(); } finally { Perf.slicing = was; }
    if (Perf.queue.length) Perf.month = { day: G.day, gold: P.gold };
    Perf.dirty(); return r;
  };
  for (const [o, n] of [[Towns, 'dayTick'], [Families, 'dayTick'], [Lifesim, 'monthTick'], [Diplo, 'tickDay'], [Caravans, 'dayTick'], [Battles, 'dayTick'], [Biz, 'dayTick'], [Market, 'dayTick'], [Content, 'monthTick'], [Society, 'monthTick'], [Politics, 'monthTick'], [Bank, 'monthTick'], [Commerce, 'monthTick'], [Reign, 'monthTick'], [Religion, 'monthTick'], [VillageWorks, 'monthTick'], [News, 'monthTick']]) if (o) Perf.defer(o, n, (Object.entries({ Towns, Families, Lifesim, Diplo, Caravans, Battles, Biz, Market, Content, Society, Politics, Bank, Commerce, Reign, Religion, VillageWorks, News }).find(([, v]) => v === o) || ['?'])[0] + '.' + n);
  // dentro das vilas e das famílias, cada subsistema vira uma fatia própria
  for (const [o, n, l] of [[Towns, 'settle', 'Towns.settle'], [NpcRoads, 'tick', 'NpcRoads.tick'], [NpcRoads, 'upgradeTick', 'NpcRoads.upgradeTick'], [NpcRoads, 'travelTick', 'NpcRoads.travelTick'],
    [NPCWork, 'monthTick', 'NPCWork.monthTick'], [NPCWork, 'clearTick', 'NPCWork.clearTick'], [Faith, 'monthTick', 'Faith.monthTick'], [People, 'purseTick', 'People.purseTick'], [Ports, 'monthTick', 'Ports.monthTick'],
    [Shops, 'ensure', 'Shops.ensure'], [Trips, 'monthTick', 'Trips.monthTick'], [Families, 'crownTick', 'Families.crownTick'], [Laws, 'monthTick', 'Laws.monthTick'], [Mercs, 'monthTick', 'Mercs.monthTick'], [Games, 'monthTick', 'Games.monthTick']]) Perf.defer(o, n, l);
  // a virada do mês "ao vivo" é a que acontece no laço do jogo
  // a virada inteira (envelhecer, guardas, arena, casas) também entra em fatias
  const nd0 = Game.onNewDay.bind(Game);
  Game.onNewDay = function () { if (!Perf.live) return nd0(); Perf.flush(); Perf.slicing = true; try { return nd0(); } finally { Perf.slicing = false; } };
  for (const [o, n, l] of [[People, 'tickYear', 'People.tickYear'], [Homes, 'dayTick', 'Homes.dayTick'], [Guards, 'dayTick', 'Guards.dayTick'], [Arena, 'dayTick', 'Arena.dayTick'], [Progress, 'dayTick', 'Progress.dayTick']]) Perf.defer(o, n, l);
  const gu0 = Game.update.bind(Game);
  Game.update = function (dt) { Perf.live = true; try { return gu0(dt); } finally { Perf.live = false; } };
  // antes de salvar (ou de carregar outro jogo), o mês termina de rodar
  const sn0 = Game.snapshot.bind(Game);
  Game.snapshot = function (...a) { Perf.flush(); return sn0(...a); };
  const ld0 = Game.load.bind(Game);
  Perf.reset = () => { Perf.queue = []; Perf.notes = null; Perf.month = null; Perf.slicing = false; Perf.miniJob = null; Perf.miniDirty = false; Perf.routes.clear(); Perf.dirty(); };
  Game.load = function (...a) { Perf.reset(); return ld0(...a); };
  for (const n of ['newGame', 'toMenu']) { const f = Game[n].bind(Game); Game[n] = function (...a) { Perf.reset(); return f(...a); }; }
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { try { cu0(dt); } finally { Perf.update(dt); } };
}
