'use strict';
// Ruas das vilas: estrada só em volta dos imóveis construídos (os lotes vazios, das casas que ainda vão surgir, ficam
// no campo). Quando um imóvel novo aparece, ele ganha a estrada dele. Dois imóveis lado a lado ficam a um quadrado de
// distância e dividem a mesma estrada — nunca duas estradas encostadas uma na outra. Saíram a avenida, a rua principal
// e a estrada em volta da vila; cada imóvel se liga à estrada mais próxima, e a vila à estrada de fora.
const RUAS_V = 2;
const Ruas = {
  sig: {},
  visible(vi) { const v = World.villages[vi]; return v ? TownPlan.members(vi).filter(s => !s.hidden && TownPlan.inBox(v, s.x, s.y)) : []; },
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
  TownPlan.roads = function (vi) {
    const v = World.villages[vi]; if (!v) return;
    const C = CastleRoads, W = WORLD_W, M = Ruas.visible(vi), all = new Set();
    for (const s of M) {
      const ring = [];
      for (let j = s.y - 1; j <= s.y + s.h; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) {
        if (j !== s.y - 1 && j !== s.y + s.h && i !== s.x - 1 && i !== s.x + s.w) continue;
        if (!World.inb(i, j)) continue; const k = World.idx(i, j);
        if (C.carve(i, j) || World.tiles[k] === T.ROAD) { ring.push(k); all.add(k); }
      }
      s._ring = ring;
    }
    // cada imóvel até a estrada mais próxima que não seja a dele; e a vila inteira até a estrada de fora
    for (const s of M) if (s._ring && s._ring.length) { C.link(s._ring, new Set(s._ring)); delete s._ring; }
    if (all.size) {
      const cl = new Set(all), q = [...all];
      for (let h = 0; h < q.length; h++) { const k = q[h], x = k % W, y = (k / W) | 0; for (const [dx, dy] of DIRS4) { const n = World.idx(x + dx, y + dy); if (!cl.has(n) && World.tiles[n] === T.ROAD && TownPlan.inBox(v, x + dx, y + dy)) { cl.add(n); q.push(n); } } }
      C.link([...cl], cl);
    }
    World.touchArea(v.x - PLAN_HX - 3, v.y - PLAN_HY - 3, PLAN_HX * 2 + 7, PLAN_HY * 2 + 7);
  };
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
      World.villages.forEach((v, vi) => { if (!v || v.ruin) return; Ruas.clear(vi); this.organize(vi, true); this.roads(vi); Ruas.sig[vi] = Ruas.visible(vi).map(s => s.id).join(','); });
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
        const sg = Ruas.visible(vi).map(s => s.id).join(',');
        if (Ruas.sig[vi] !== undefined && Ruas.sig[vi] !== sg) TownPlan.roads(vi);
        Ruas.sig[vi] = sg;
      }
    } catch (e) { console.error(e); }
    return r;
  };
}
