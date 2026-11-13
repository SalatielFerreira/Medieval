'use strict';
// Imóveis largos e baixos (3×2, 4×2, 2×1, 3×1 — o chalé, a biblioteca, a casa longa, o estábulo, a barbearia...)
// ficavam achatados: o desenho ocupava a largura toda e quase nada de altura. Agora eles crescem para cima, na proporção
// da largura (o chão que ocupam é o mesmo). Campos, hortas, lagos, cercados e bancadas continuam como eram.
const TALL_SKIP = new Set(['farm', 'field', 'ffarm', 'fvine', 'flaxfield', 'garden', 'hopfield', 'herbgarden', 'sunflowers', 'duckpond', 'fishpond', 'pond_d', 'pigsty', 'goatpen', 'pen',
  'olivegrove', 'orchard', 'vineyard', 'archery', 'tiltyard', 'training', 'stone_circle', 'dyeworks', 'biz_farm', 'biz_ranch', 'biz_saltworks', 'biz_mason', 'biz_charcoal', 'biz_shipyard',
  'dock', 'crane', 'siege_workshop', 'stage', 'market_stall', 'fshop', 'store', 'biz_shop', 'vmarket', 'toll', 'trench', 'sewer', 'tanrack', 'spikes', 'loom', 'goldsmith', 'alchemy', 'oven',
  'rabbithutch', 'arch', 'tent', 'port', 'cemetery', 'arena', 'castle', 'camp', 'cave', 'cave_exit', 'bridge', 'quern', 'smokehouse', 'herbgarden', 'cellar', 'icehouse', 'beehive']);
const Predios = {
  stretch(s) {
    if (!s || !s.w || !s.h || s.w <= s.h || TALL_SKIP.has(s.type) || /^wall|^vwall|^vgate|^c?wall/.test(s.type)) return 1;
    if (typeof CIVIC !== 'undefined' && CIVIC[s.type] && /field|garden|pasture|orchard|vine|barley|flax|hens|cattle|pigs|wood|fishery|laundry|apiary|orchard/.test(s.type)) return 1;
    return Math.min(1.5, Math.max(1, Math.round(s.w / s.h * 0.8 * 4) / 4)); // 3×2 → 1,25 · 4×2 / 2×1 / 3×1 → 1,5
  },
};
{
  const ds0 = World.drawStruct.bind(World);
  World.drawStruct = function (ctx, s, X, Y, time) {
    const k = Predios.stretch(s); if (k === 1) return ds0(ctx, s, X, Y, time);
    const base = Y + s.h * TILE; // o chão (a base fica no lugar; o desenho cresce para cima)
    ctx.save(); ctx.translate(0, base); ctx.scale(1, k); ctx.translate(0, -base);
    try { return ds0(ctx, s, X, Y, time); } finally { ctx.restore(); }
  };
}
