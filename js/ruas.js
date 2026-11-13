'use strict';
// Ruas das vilas: estrada só em volta dos imóveis construídos (os lotes vazios, das casas que ainda vão surgir, ficam
// no campo). Quando um imóvel novo aparece, ele ganha a estrada dele. Dois imóveis lado a lado ficam a um quadrado de
// distância e dividem a mesma estrada — nunca duas estradas encostadas uma na outra. Saíram a avenida, a rua principal
// e a estrada em volta da vila; cada imóvel se liga à estrada mais próxima, e a vila à estrada de fora.
const RUAS_V = 2;
const Ruas = {
  sig: {},
  // os imóveis construídos da vila (leve: sem as comparações de texto do traçado)
  visible(vi) { const v = World.villages[vi]; if (!v) return []; const out = []; for (const s of World.structs) if (s && s.village === vi && !s.removed && !s.hidden && s.w && s.h && s.owner !== 'player' && !s.built && !PLAN_KEEP.includes(s.type) && !/wall|gate|tower/.test(s.type) && TownPlan.inBox(v, s.x, s.y)) out.push(s); return out; },
  // apaga as estradas da área da vila (menos as que você abriu) — usada uma vez, para trocar o traçado antigo
  clear(vi) {
    const v = World.villages[vi], E = Urban.E();
    for (let j = v.y - PLAN_HY - 1; j <= v.y + PLAN_HY + 1; j++) for (let i = v.x - PLAN_HX - 1; i <= v.x + PLAN_HX + 1; i++) {
      if (!World.inb(i, j) || TownPlan.nearestV(i, j) !== vi) continue; const k = World.idx(i, j);
      if (World.tiles[k] === T.ROAD && E.mine[k] === undefined) { const g = Urban.groundOf(k); World.tiles[k] = g; E.roads[k] = g; if (World.roadLv) World.roadLv[k] = 0; if (E.rlv) delete E.rlv[k]; }
    }
  },
};
{
  // as ruas: o anel de cada imóvel construído, ligado à estrada mais próxima
  TownPlan.roads = function (vi, month) {
    const v = World.villages[vi]; if (!v) return;
    const C = CastleRoads, W = WORLD_W, M = Ruas.visible(vi), all = new Set();
    for (const s of M) {
      const ring = []; let fresh = 0;
      for (let j = s.y - 1; j <= s.y + s.h; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) {
        if (j !== s.y - 1 && j !== s.y + s.h && i !== s.x - 1 && i !== s.x + s.w) continue;
        if (!World.inb(i, j)) continue; const k = World.idx(i, j);
        if (C.carve(i, j)) { fresh++; ring.push(k); all.add(k); } else if (World.tiles[k] === T.ROAD) { ring.push(k); all.add(k); }
      }
      if (fresh) s._ring = ring; // (só quem ganhou estrada agora precisa se ligar ao resto)
    }
    // cada imóvel até a estrada mais próxima que não seja a dele; e a vila inteira até a estrada de fora
    // (na virada do mês, no máximo dois imóveis novos por vez: o resto fica para o mês seguinte)
    let links = 0;
    for (const s of M) if (s._ring && s._ring.length) { if (month && links >= 2) { (Ruas.dirty || (Ruas.dirty = new Set())).add(vi); delete s._ring; continue; } C.link(s._ring, new Set(s._ring)); delete s._ring; s._done = 1; links++; }
    if (all.size && !month && M.some(s => s._done)) {
      const cl = new Set(all), q = [...all];
      for (let h = 0; h < q.length; h++) { const k = q[h], x = k % W, y = (k / W) | 0; for (const [dx, dy] of DIRS4) { const n = World.idx(x + dx, y + dy); if (!cl.has(n) && World.tiles[n] === T.ROAD && TownPlan.inBox(v, x + dx, y + dy)) { cl.add(n); q.push(n); } } }
      C.link([...cl], cl);
    }
    for (const s of M) delete s._done;
    // redesenha só o que mudou (o minimapa ponto a ponto na área inteira custava ~30 ms)
    const x0 = v.x - PLAN_HX - 3, y0 = v.y - PLAN_HY - 3, x1 = v.x + PLAN_HX + 4, y1 = v.y + PLAN_HY + 4;
    if (World.chunks) for (let cy = Math.floor(y0 / CH); cy <= Math.floor(y1 / CH); cy++) for (let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++) World.chunks.delete(cx + ',' + cy);
    if (World.mini) for (const k of Ruas.carved) World.miniPixel(k);
    Ruas.carved.clear();
  };
  // as estradas abertas pelas ruas (para o minimapa redesenhar só elas)
  Ruas.carved = new Set();
  { const cv0 = CastleRoads.carve.bind(CastleRoads); CastleRoads.carve = function (i, j) { const r = cv0(i, j); if (r) Ruas.carved.add(World.idx(i, j)); if (Ruas.carved.size > 5000) Ruas.carved.clear(); return r; }; }
  // lotes: dois imóveis na mesma fileira ficam a 1 quadrado (dividem a estrada) ou a 3 ou mais — nunca a 2 (duas
  // estradas encostadas)
  const ft0 = TownPlan.fits.bind(TownPlan);
  TownPlan.fits = function (s, x, y, hh, vi, occ, px, py) {
    if (!ft0(s, x, y, hh, vi, occ, px, py)) return false;
    const has = (i, j) => World.inb(i, j) && occ.has(World.idx(i, j)) && occ.get(World.idx(i, j)) !== s.id;
    for (let j = y; j < y + s.h; j++) {
      if (!has(x - 2, j) && has(x - 3, j)) return false;
      if (!has(x + s.w + 1, j) && has(x + s.w + 2, j)) return false;
    }
    return true;
  };
  // jogos salvos e jogo novo: o traçado antigo (avenida, anéis dos lotes vazios, estrada em volta) é trocado uma vez
  const en0 = TownPlan.ensure.bind(TownPlan);
  TownPlan.ensure = function () {
    const S = this.S(), n = en0();
    if ((S.rv || 0) < RUAS_V) {
      World.villages.forEach((v, vi) => { if (!v || v.ruin) return; Ruas.clear(vi); this.organize(vi, true); this.roads(vi); Ruas.sig[vi] = (v.level || 1) + ':' + World.structs.length; });
      S.rv = RUAS_V; Towns.settle(); World.chunks.clear(); World.buildMinimap();
    }
    return n;
  };
  // um imóvel novo apareceu (a vila cresceu, uma família construiu): ganha a estrada dele
  const sh0 = Towns.show.bind(Towns);
  Towns.show = function (v) {
    const r = sh0(v);
    try {
      const vi = World.villages.indexOf(v);
      if (vi >= 0 && (TownPlan.S().rv || 0) >= RUAS_V && !TownPlan.busy) {
        const sg = (v.level || 1) + ':' + World.structs.length; // (barato: muda quando a vila sobe de nível ou surge uma construção)
        if (Ruas.sig[vi] !== undefined && Ruas.sig[vi] !== sg) (Ruas.dirty || (Ruas.dirty = new Set())).add(vi); // (as ruas novas saem na virada do mês)
        Ruas.sig[vi] = sg;
      }
    } catch (e) { console.error(e); }
    return r;
  };
}

// ---------------------------------------------------------------- estradas entre os reinos religadas
// A troca do traçado apagava os pedaços das estradas de fora que atravessavam a vila: elas ficavam com a ponta solta
// perto da vila. Agora cada ponta solta perto de uma vila é ligada às ruas dela (e por elas às outras estradas).
Object.assign(Ruas, {
  ends(vi) {
    const v = World.villages[vi], out = [], R = 12;
    for (let j = v.y - PLAN_HY - R; j <= v.y + PLAN_HY + R; j++) for (let i = v.x - PLAN_HX - R; i <= v.x + PLAN_HX + R; i++) {
      if (!World.inb(i, j) || (Math.abs(i - v.x) <= PLAN_HX + 1 && Math.abs(j - v.y) <= PLAN_HY + 1)) continue;
      const k = World.idx(i, j); if (World.tiles[k] !== T.ROAD && World.tiles[k] !== T.BRIDGE) continue;
      let n = 0; for (const [dx, dy] of DIRS4) { const t = World.tile(i + dx, j + dy); if (t === T.ROAD || t === T.BRIDGE) n++; }
      if (n <= 1) out.push(k);
    }
    return out;
  },
  // o caminho (pela terra) de uma ponta solta até uma das ruas da vila
  join(from, target) {
    const W = WORLD_W, C = CastleRoads, prev = new Map([[from, -1]]), q = [from]; let found = -1;
    for (let h = 0; h < q.length && q.length < 6000; h++) {
      const k = q[h], x = k % W, y = (k / W) | 0;
      if (k !== from && target.has(k)) { found = k; break; }
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx, ny = y + dy; if (!World.inb(nx, ny)) continue; const n = World.idx(nx, ny);
        if (prev.has(n) || !C.free(n)) continue; const t = World.tiles[n];
        if (t !== T.ROAD && t !== T.BRIDGE && !ROAD_GROUND.includes(t)) continue;
        prev.set(n, k); q.push(n);
      }
    }
    if (found < 0) return false;
    for (let k = found; k >= 0; k = prev.get(k)) if (World.tiles[k] !== T.ROAD && World.tiles[k] !== T.BRIDGE) C.carve(k % W, (k / W) | 0);
    return true;
  },
  reconnect(vi) {
    const v = World.villages[vi]; if (!v || v.ruin) return 0;
    const target = new Set();
    for (let j = v.y - PLAN_HY - 1; j <= v.y + PLAN_HY + 1; j++) for (let i = v.x - PLAN_HX - 1; i <= v.x + PLAN_HX + 1; i++) if (World.inb(i, j) && World.tiles[World.idx(i, j)] === T.ROAD) target.add(World.idx(i, j));
    if (!target.size) return 0;
    let n = 0; for (const e of this.ends(vi)) if (this.join(e, target)) n++;
    if (n) World.touchArea(v.x - PLAN_HX - 14, v.y - PLAN_HY - 14, PLAN_HX * 2 + 29, PLAN_HY * 2 + 29);
    return n;
  },
});
{
  const en1 = TownPlan.ensure.bind(TownPlan);
  TownPlan.ensure = function () {
    const r = en1(), S = this.S();
    if ((S.rc || 0) < 1) { World.villages.forEach((v, vi) => { if (v && !v.ruin) Ruas.reconnect(vi); }); S.rc = 1; World.chunks.clear(); World.buildMinimap(); }
    return r;
  };
}

// ---------------------------------------------------------------- toda vila e todo castelo na mesma malha de estradas
// Depois de criar ou rearrumar vilas, uma checagem geral: cada vila e cada castelo que ficou numa malha separada é
// ligado à malha principal pelo caminho mais curto (pela terra).
Ruas.connectAll = function () {
  const W = WORLD_W, N = W * WORLD_H, C = CastleRoads, road = k => World.tiles[k] === T.ROAD || World.tiles[k] === T.BRIDGE;
  const label = () => {
    const comp = new Int32Array(N).fill(-1); let id = 0;
    for (let k = 0; k < N; k++) { if (!road(k) || comp[k] >= 0) continue; const q = [k]; comp[k] = id; for (let h = 0; h < q.length; h++) { const x = q[h] % W, y = (q[h] / W) | 0; for (const [dx, dy] of DIRS4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= WORLD_H) continue; const n = ny * W + nx; if (road(n) && comp[n] < 0) { comp[n] = id; q.push(n); } } } id++; }
    return comp;
  };
  const near = (comp, x, y) => { for (let r = 0; r < 10; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r || !World.inb(x + i, y + j)) continue; const k = World.idx(x + i, y + j); if (comp[k] >= 0) return k; } return -1; };
  const pts = [...World.capitals.filter(c => c && c.door).map(c => [c.door.x, c.door.y]), ...World.villages.filter(v => v && !v.ruin).map(v => [v.x, v.y])];
  let fixed = 0;
  for (let pass = 0; pass < pts.length + 2; pass++) {
    const comp = label(), ks = pts.map(([x, y]) => near(comp, x, y)), cnt = {};
    for (const k of ks) if (k >= 0) cnt[comp[k]] = (cnt[comp[k]] || 0) + 1;
    const main = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    const lone = ks.findIndex(k => k < 0 || comp[k] !== main); if (lone < 0) break;
    // a partir da malha separada (ou do ponto sem estrada), o caminho até a malha principal
    const c0 = ks[lone] >= 0 ? comp[ks[lone]] : -2, prev = new Map(), q = [];
    if (c0 >= 0) { for (let k = 0; k < N; k++) if (comp[k] === c0) { prev.set(k, -1); q.push(k); } }
    else { const k = World.idx(pts[lone][0], pts[lone][1]); prev.set(k, -1); q.push(k); }
    let found = -1;
    for (let h = 0; h < q.length && q.length < 200000; h++) {
      const k = q[h], x = k % W, y = (k / W) | 0;
      if (comp[k] === main) { found = k; break; }
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx, ny = y + dy; if (!World.inb(nx, ny)) continue; const n = World.idx(nx, ny);
        if (prev.has(n) || !C.free(n)) continue; const t = World.tiles[n];
        if (!road(n) && !ROAD_GROUND.includes(t) && t !== T.WATER) continue;
        prev.set(n, k); q.push(n);
      }
    }
    if (found < 0) break;
    for (let k = found; k >= 0; k = prev.get(k)) if (!road(k)) { if (World.tiles[k] === T.WATER) { World.tiles[k] = T.BRIDGE; Urban.E().roads[k] = T.BRIDGE; } else C.carve(k % W, (k / W) | 0); }
    fixed++;
  }
  if (fixed) { World.chunks.clear(); World.buildMinimap(); }
  return fixed;
};

{
  // imóveis novos ganham a estrada na virada do mês, uma vila por vez (no dia a dia, refazer as ruas travava a tela)
  const mt0 = TownPlan.monthTick.bind(TownPlan);
  TownPlan.monthTick = function (...a) {
    const r = mt0(...a), D = Ruas.dirty; if (!D || !D.size) return r;
    const list = [...D]; D.clear();
    for (const vi of list) { const job = () => { try { TownPlan.roads(vi, true); } catch (e) { console.error(e); } }; if (typeof Perf !== 'undefined' && Perf.slicing) Perf.queue.push(Object.assign(job, { label: 'Ruas.roads' })); else job(); }
    return r;
  };
}
