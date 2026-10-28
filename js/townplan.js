'use strict';
// Vilas organizadas: as casas e os imóveis de cada vila ficam alinhados em quarteirões dentro da área da vila, e a estrada
// rodeia cada um — de um imóvel para o outro só há estrada. O traçado:
//  • ruas na horizontal a cada 3 blocos (a rua principal passa pelo centro da vila), com os imóveis em fileiras entre elas;
//  • uma avenida na vertical pelo centro e uma estrada em volta da vila (por dentro da muralha), onde chegam as estradas
//    de fora;
//  • entre dois imóveis da mesma fileira, uma travessa de 1 bloco; os maiores ocupam duas fileiras.
// Na primeira vez (jogo novo ou jogo salvo antigo) a vila inteira é reorganizada; depois, todo mês, o que foi construído
// fora do traçado (casas novas dos moradores, negócios das famílias, obras) ganha um lote. Os seus imóveis e o que você
// mudou de lugar com as próprias mãos não são mexidos.
const PLAN_V = 1;
const PLAN_HX = 14, PLAN_HY = 11;           // meia largura e meia altura da área dos lotes (a muralha fica em 16 × 13)
const PLAN_KEEP = ['vwall', 'vgate', 'castle', 'bank', 'cemetery', 'arena', 'cathedral', 'port', 'camp'];

const TownPlan = {
  busy: false,
  S() { const u = G.urban || (G.urban = {}); u.plan = u.plan || { v: 0, user: [] }; return u.plan; },
  ukey(s) { return s.type + '@' + s.x + ',' + s.y; },
  userPlaced(s) { return this.S().user.includes(this.ukey(s)); },
  // a vila mais perto deste bloco (os lotes e as ruas de uma vila não invadem a vizinha)
  nearestV(x, y) { let b = -1, bd = 1e9; World.villages.forEach((v, i) => { if (!v) return; const d = Math.abs(x - v.x) + Math.abs(y - v.y) * 1.25; if (d < bd) { bd = d; b = i; } }); return b; },
  inBox(v, x, y) { return Math.abs(x - v.x) <= PLAN_HX && Math.abs(y - v.y) <= PLAN_HY; },
  // o que o traçado arruma nesta vila
  members(vi) {
    const v = World.villages[vi];
    return World.structs.filter(s => s && !s.removed && s.w && s.h && s.owner !== 'player' && !s.built && !PLAN_KEEP.includes(s.type) && !/wall|gate|tower/.test(s.type)
      && (s.village === vi || (s.type === 'field' && s.village === undefined && this.inBox(v, s.x, s.y) && this.nearestV(s.x, s.y) === vi)) && !this.userPlaced(s));
  },
  span(h) { return h <= 2 ? 2 : h <= 5 ? 5 : 8; },
  ground(i) { const t = World.tiles[i]; return ROAD_GROUND.includes(t) || (t === T.ROAD && !(Urban.E().mine[i] !== undefined)); },
  // arruma uma vila; full = reorganiza tudo (a primeira vez), senão só põe nos lotes o que está fora do traçado
  organize(vi, full) {
    const v = World.villages[vi]; if (!v || G.dungeon) return 0;
    const M = this.members(vi), E = Urban.E();
    const x0 = v.x - PLAN_HX - 2, x1 = v.x + PLAN_HX + 2, y0 = v.y - PLAN_HY - 2, y1 = v.y + PLAN_HY + 2;
    const occ = new Map(); // índice do bloco → construção (só a área da vila)
    const O = { get: k => occ.has(k) ? occ.get(k) : -1 };
    const mark = (s, id) => { for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) if (World.inb(i, j)) occ.set(World.idx(i, j), id); };
    const inM = new Set(M.map(s => s.id));
    for (let j = y0 - 8; j <= y1 + 8; j++) for (let i = x0 - 8; i <= x1 + 8; i++) {
      if (!World.inb(i, j)) continue; const k = World.idx(i, j), id = World.sgrid[k];
      if (id >= 0 && World.structs[id] && !World.structs[id].removed && !inM.has(id)) occ.set(k, id);
    }
    let todo;
    if (full) todo = M.slice();
    else { for (const s of M) mark(s, s.id); todo = M.filter(s => !this.placedOk(s, vi, O)); for (const s of todo) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) if (World.inb(i, j) && occ.get(World.idx(i, j)) === s.id) occ.delete(World.idx(i, j)); }
    if (!todo.length) return 0;
    // primeiro a loja, a taverna e a capela (perto do centro), depois do maior para o menor
    const pri = s => (['store', 'tavern', 'chapel', 'smith'].includes(s.type) ? 0 : s.hidden ? 2 : 1);
    todo.sort((a, b) => pri(a) - pri(b) || b.w * b.h - a.w * a.h || a.id - b.id);
    // na reorganização completa, as estradas antigas dentro da área saem (o traçado novo as substitui)
    if (full) for (let j = v.y - PLAN_HY; j <= v.y + PLAN_HY; j++) for (let i = v.x - PLAN_HX; i <= v.x + PLAN_HX; i++) {
      if (!World.inb(i, j) || this.nearestV(i, j) !== vi) continue; const k = World.idx(i, j);
      if (World.tiles[k] === T.ROAD && E.mine[k] === undefined) { const g = Urban.groundOf(k); World.tiles[k] = g; E.roads[k] = g; if (World.roadLv) World.roadLv[k] = 0; delete E.rlv[k]; }
    }
    const px = Math.floor(P.x / TILE), py = Math.floor(P.y / TILE);
    const rows = []; for (let k = -4; k <= 4; k++) { const top = v.y + 3 * k; rows.push(top); }
    const placed = [];
    for (const s of todo) {
      const hh = this.span(s.h); let best = null, bs = 1e9;
      for (const top of rows) {
        if (top < v.y - PLAN_HY || top + hh - 1 > v.y + PLAN_HY) continue;
        for (let x = v.x - PLAN_HX; x + s.w - 1 <= v.x + PLAN_HX; x++) {
          if (x <= v.x && x + s.w - 1 >= v.x) continue; // a avenida do centro fica livre
          const sc = Math.abs(x + s.w / 2 - v.x - 0.5) + Math.abs(top + hh / 2 - v.y) * 1.6;
          if (sc >= bs) continue;
          if (this.fits(s, x, top, hh, vi, occ, px, py)) { bs = sc; best = { x, y: top }; }
        }
      }
      if (!best) continue;
      mark({ x: best.x, y: best.y, w: s.w, h: s.h }, s.id);
      placed.push([s, best]);
    }
    // muda de lugar (sem descartar as casas escondidas que ainda vão mudar) e anota no jogo salvo
    this.busy = true;
    try {
      for (const [s] of placed) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) { if (!World.inb(i, j)) continue; const k = World.idx(i, j); if (World.sgrid[k] === s.id) World.sgrid[k] = -1; }
      for (const [s, b] of placed) {
        const ox = s.x, oy = s.y; if (ox === b.x && oy === b.y) { mark(s, s.id); for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) World.sgrid[World.idx(i, j)] = s.id; continue; }
        World.structTouch({ x: ox, y: oy, w: s.w, h: s.h });
        s.x = b.x; s.y = b.y;
        for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) { const k = World.idx(i, j); World.sgrid[k] = s.id; World.obj[k] = 0; if (World.tiles[k] === T.ROAD && E.mine[k] === undefined) { const g = Urban.groundOf(k); World.tiles[k] = g; E.roads[k] = g; } }
        const ok = ox + ',' + oy, nk = s.x + ',' + s.y;
        if (G.storage && G.storage[ok]) { G.storage[nk] = G.storage[ok]; delete G.storage[ok]; }
        if (s.fam !== undefined) {
          const f = Families.get(s.fam), bz = f && f.biz.find(q => q.type === s.type && q.x === ox && q.y === oy);
          if (bz) {
            bz.x = s.x; bz.y = s.y;
            // o negócio da família volta no lugar novo ao carregar: a chave dele (e a do responsável) acompanha
            const old = s.okey; s.okey = s.type + '@' + s.x + ',' + s.y;
            if (old !== s.okey) { for (const p of G.people) if (p.shop === old) p.shop = s.okey; if (Shops._map) Shops._map = null; }
          }
        }
        Urban.record('move', s, ox, oy);
        World.structTouch(s);
      }
    } finally { this.busy = false; }
    this.roads(vi);
    return placed.length;
  },
  // está num lote do traçado, sem nenhum vizinho encostado?
  placedOk(s, vi, O) {
    const v = World.villages[vi];
    if (!this.inBox(v, s.x, s.y) || !this.inBox(v, s.x + s.w - 1, s.y + this.span(s.h) - 1)) return false;
    if ((((s.y - v.y) % 3) + 3) % 3 !== 0) return false;
    if (s.x <= v.x && s.x + s.w - 1 >= v.x) return false;
    for (let j = s.y - 1; j <= s.y + s.h; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) { if (!World.inb(i, j)) return false; const o = O.get(World.idx(i, j)); if (o >= 0 && o !== s.id) return false; }
    return true;
  },
  // o lote cabe? o imóvel em terra boa e livre, com 1 bloco livre em volta (a estrada), longe do herói
  fits(s, x, y, hh, vi, occ, px, py) {
    if (px >= x - 1 && px <= x + s.w && py >= y - 1 && py <= y + s.h) return false;
    for (let j = y - 1; j <= y + Math.max(s.h, 1); j++) for (let i = x - 1; i <= x + s.w; i++) {
      if (!World.inb(i, j)) return false;
      const k = World.idx(i, j), o = occ.has(k) ? occ.get(k) : -1;
      if (o >= 0 && o !== s.id) return false;
      const inner = i >= x && i < x + s.w && j >= y && j < y + s.h;
      if (inner) { if (!this.ground(k) || this.nearestV(i, j) !== vi) return false; }
      else { const t = World.tiles[k]; if (t === T.WATER || t === T.DEEP || t === T.MOUNT) return false; }
    }
    return true;
  },
  // as ruas: em volta de cada imóvel, as fileiras até a avenida, a avenida, a rua principal e a estrada de volta
  roads(vi) {
    const v = World.villages[vi], E = Urban.E(), M = this.members(vi).filter(s => this.inBox(v, s.x, s.y));
    const carve = (i, j) => {
      if (!World.inb(i, j)) return; const k = World.idx(i, j);
      const id = World.sgrid[k]; if (id >= 0 && World.structs[id] && !World.structs[id].removed) return;
      if (!ROAD_GROUND.includes(World.tiles[k])) return;
      World.tiles[k] = T.ROAD; World.obj[k] = 0; E.roads[k] = T.ROAD;
    };
    let ymin = v.y - 1, ymax = v.y - 1;
    const reach = {};
    for (const s of M) {
      const hh = this.span(s.h);
      for (let j = s.y - 1; j <= s.y + hh; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) carve(i, j);
      for (const yy of [s.y - 1, s.y + hh]) { const r = reach[yy] || (reach[yy] = [v.x, v.x]); r[0] = Math.min(r[0], s.x - 1); r[1] = Math.max(r[1], s.x + s.w); }
      ymin = Math.min(ymin, s.y - 1); ymax = Math.max(ymax, s.y + hh);
    }
    for (const yy in reach) for (let i = reach[yy][0]; i <= reach[yy][1]; i++) carve(i, +yy);
    for (let j = v.y - PLAN_HY - 1; j <= v.y + PLAN_HY + 1; j++) carve(v.x, j);
    for (let i = v.x - PLAN_HX - 1; i <= v.x + PLAN_HX + 1; i++) carve(i, v.y - 1);
    // a estrada de volta (por dentro da muralha): as estradas de fora chegam nela
    for (let i = v.x - PLAN_HX - 1; i <= v.x + PLAN_HX + 1; i++) { carve(i, v.y - PLAN_HY - 1); carve(i, v.y + PLAN_HY + 1); }
    for (let j = v.y - PLAN_HY - 1; j <= v.y + PLAN_HY + 1; j++) { carve(v.x - PLAN_HX - 1, j); carve(v.x + PLAN_HX + 1, j); }
    World.touchArea(v.x - PLAN_HX - 2, v.y - PLAN_HY - 2, PLAN_HX * 2 + 5, PLAN_HY * 2 + 5);
  },
  // jogo novo ou carregado: a primeira vez reorganiza todas as vilas; depois só o que saiu do traçado
  ensure() {
    const S = this.S(), full = S.v < PLAN_V;
    let n = 0; World.villages.forEach((v, vi) => { if (v && !v.ruin) n += this.organize(vi, full); });
    S.v = PLAN_V;
    if (full) Towns.settle();
    if (n || full) { World.chunks.clear(); World.buildMinimap(); }
    return n;
  },
  // durante o jogo, cada vila é um pedaço próprio do mês (arrumar todas de uma vez travava um quadro)
  monthTick() {
    if (typeof Perf !== 'undefined' && Perf.slicing) {
      World.villages.forEach((v, vi) => { if (v) Perf.queue.push(Object.assign(() => { if (World.villages[vi] && this.organize(vi, false)) World.buildMinimap(); }, { label: 'TownPlan.organize' })); });
      return;
    }
    let n = 0; World.villages.forEach((v, vi) => { if (v) n += this.organize(vi, false); }); if (n) World.buildMinimap();
  },
};

{
  // ao carregar, as mudanças de lugar são refeitas uma a uma: nenhuma casa escondida é descartada no meio do caminho
  const ur0 = Urban.restore.bind(Urban);
  Urban.restore = function (...a) { const fh = World.freeHidden; World.freeHidden = () => {}; try { return ur0(...a); } finally { World.freeHidden = fh; } };
  // o que você muda de lugar com as próprias mãos fica onde você pôs
  const rl0 = Urban.relocate.bind(Urban);
  Urban.relocate = function (s, nx, ny, quiet) {
    const r = rl0(s, nx, ny, quiet);
    if (!quiet && !TownPlan.busy && s.owner !== 'player') { const S = TownPlan.S(); if (!S.user.includes(TownPlan.ukey(s))) S.user.push(TownPlan.ukey(s)); }
    return r;
  };
  for (const k of ['newGame', 'load']) {
    const f0 = Game[k].bind(Game);
    Game[k] = async function (...a) { const r = await f0(...a); if (G.state === 'play') { try { TownPlan.ensure(); } catch (e) { console.error(e); } } return r; };
  }
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); TownPlan.monthTick(); };
}
