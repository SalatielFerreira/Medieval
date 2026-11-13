// Sociedade Thule, estradas e interiores temáticos dos templos, e os imóveis largos que não ficam mais achatados.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.god = true;
      ok(SECRET_SOC.thule && SOC_LORE.thule && SOC_LORE.thule.head === 'Mestre de Thule', 'a Sociedade Thule não existe');
      const L = Lodges.L(), live = G.civs.filter(c => c && !c.dead && World.capitals[c.id]).length;
      ok(L.list.filter(x => x.k === 'thule').length >= live - 1, 'faltam templos da Thule nos reinos');
      const withRoad = L.list.filter(x => { const s = Lodges.struct(x.k, x.ci); if (!s) return false; for (let i = s.x - 1; i <= s.x + s.w; i++) for (const j of [s.y - 1, s.y + s.h]) if (World.tiles[World.idx(i, j)] === T.ROAD) return true; return false; }).length;
      ok(withRoad >= L.list.length * 0.9, `templos sem estrada: ${L.list.length - withRoad} de ${L.list.length}`);
      // só irmãos entram; o interior tem o tema da sociedade e o altar abre o templo
      const x = L.list.find(q => q.k === 'thule'), s = Lodges.struct(x.k, x.ci);
      ok(!Places.enterable(s), 'quem não é irmão entra no templo');
      const S = Secret.S(); S.invites.thule = { by: 0, until: G.day + 3 }; Secret.accept('thule');
      P.x = (s.x + 1.5) * TILE; P.y = (s.y + 4) * TILE;
      ok(Places.enterRoom(s) && G.place && G.place.lay === 'lodge_thule', 'o interior da Thule não abriu');
      const alt = Places.furn.find(f => f.act === 'lodge'); ok(alt, 'o templo não tem o altar');
      if (alt) { Places.use(alt); ok(UI.cur && UI.cur.fn === 'showLodge', 'o altar não abre o templo'); UI.close(); }
      Places.exit(true);
      // prédios largos: crescem para cima
      ok(Predios.stretch({ type: 'lodge', w: 3, h: 2 }) > 1 && Predios.stretch({ type: 'farm', w: 3, h: 3 }) === 1 && Predios.stretch({ type: 'garden', w: 3, h: 2 }) === 1, 'os prédios largos continuam achatados (ou os campos esticaram)');
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
