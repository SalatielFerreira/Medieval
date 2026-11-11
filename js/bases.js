'use strict';
// Base das construções: o chão embaixo de cada construção vira uma laje de cimento clarinho, discreta, com uma borda
// fina. Ela ocupa o terreno inteiro da construção, então o prédio encosta na estrada (antes sobrava uma faixa de grama
// entre a casa e a rua). Fica pintada no próprio chão (sem custo a cada quadro) e é cinza, para não se misturar com as
// paredes. Muros, portões, cais, cavernas e acampamentos continuam sobre o terreno de sempre.
const BASES = {
  SKIP: new Set(['wall_stone', 'wall_wood', 'vwall', 'vgate', 'port', 'cave', 'cave_exit', 'camp', 'bandit_camp', 'campfire', 'bridge', 'dock', 'pier', 'ruin']),
  COL: '#cfccc3', EDGE: '#a8a499', JOINT: 'rgba(120,116,106,0.22)',
  of(x, y) {
    if (!World.inb(x, y)) return null;
    const i = World.idx(x, y), id = World.sgrid[i]; if (id < 0) return null;
    const s = World.structs[id];
    if (!s || s.removed || s.hidden || this.SKIP.has(s.type) || World.isWater(World.tiles[i])) return null;
    return s;
  },
};

{
  const pt0 = World.paintTile.bind(World);
  World.paintTile = function (g, x, y, px, py) {
    pt0(g, x, y, px, py);
    const s = BASES.of(x, y); if (!s) return;
    const r = U.mulberry32(((x * 83492791) ^ (y * 2654435761) ^ this.seed) >>> 0), H = HALF;
    let col = U.shade(BASES.COL, (r() - 0.5) * 0.04);
    if (this.season === 3) col = mixHex(col, '#eef2f5', 0.35); // no inverno, um pouco de geada
    g.fillStyle = col; g.fillRect(px, py, H, H);
    // juntas das lajes (uma cruz bem leve no meio do bloco) e uns pontinhos de textura
    g.fillStyle = BASES.JOINT; g.fillRect(px, py + H / 2, H, 1); g.fillRect(px + H / 2, py, 1, H);
    for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(90,86,78,0.18)'; g.fillRect(px + Math.floor(r() * (H - 1)), py + Math.floor(r() * (H - 1)), 1, 1); }
    // borda fina onde a base termina (só nos lados que não continuam na mesma construção)
    g.fillStyle = BASES.EDGE;
    const same = (dx, dy) => BASES.of(x + dx, y + dy) === s;
    if (!same(0, -1)) g.fillRect(px, py, H, 1);
    if (!same(0, 1)) g.fillRect(px, py + H - 1, H, 1);
    if (!same(-1, 0)) g.fillRect(px, py, 1, H);
    if (!same(1, 0)) g.fillRect(px + H - 1, py, 1, H);
  };
  // construção nova, demolida ou mudada de lugar: o chão daquele pedaço é redesenhado
  const st0 = World.structTouch.bind(World);
  World.structTouch = function (s) { const r = st0(s); if (s && this.chunks) this.touchArea(s.x, s.y, s.w, s.h); return r; };
  const as0 = World.addStruct.bind(World);
  World.addStruct = function (...a) { const s = as0(...a); if (s && this.chunks && !this.mini) this.touchArea(s.x, s.y, s.w, s.h); return s; };
  if (typeof Urban !== 'undefined') {
    const rl0 = Urban.relocate.bind(Urban);
    Urban.relocate = function (s, ...r) { const ox = s && s.x, oy = s && s.y; const res = rl0(s, ...r); if (s && World.chunks) { World.touchArea(ox, oy, s.w, s.h); World.touchArea(s.x, s.y, s.w, s.h); } return res; };
  }
}
