// As vilas não erguem muralha sozinhas ao crescer (muralha só a da capital); trechos de muralha emendados sem fresta e o sino e a janela de avisos fora do jogo.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      // as vilas não erguem muralha sozinhas (só a capital tem, em volta do castelo e do que é dele)
      World.villages.forEach(v => { v.prosper = 130; v.level = 10; }); Towns.applyAll();
      const auto = World.structs.filter(s => s && !s.removed && !s.hidden && s.type === 'vwall' && s.growth !== undefined);
      ok(!auto.length, `vilas no nível 10 ergueram ${auto.length} trechos de muralha sozinhas`);
      // dois trechos de muralha erguidos (pelo governador) lado a lado
      let sx = null; for (let r = 4; r < 80 && !sx; r += 2) for (let k = 0; k < 24 && !sx; k++) { const x = Math.round(P.x / TILE + Math.cos(k / 24 * 6.28) * r), y = Math.round(P.y / TILE + Math.sin(k / 24 * 6.28) * r); if (World.areaOk(x, y, 2, 1) && World.areaFree(x, y, 2, 1)) sx = { x, y }; }
      ok(sx, 'sem lugar para os trechos de muralha'); if (!sx) return out;
      World.addStruct('vwall', sx.x, sx.y, 1, 1, 0, { village: 0 }); World.addStruct('vwall', sx.x + 1, sx.y, 1, 1, 0, { village: 0 });
      // dois trechos lado a lado: o desenho emenda (nenhuma coluna do chão aparece entre eles)
      const W = World.structs.filter(s => s && !s.removed && s.type === 'vwall' && !s.hidden);
      const a = W.find(s => W.some(b => b.x === s.x + 1 && b.y === s.y)), b = W.find(s => s.x === a.x + 1 && s.y === a.y);
      for (const k of [1, 1.25, 1.5, 1.75, 2, 2.5]) {
        const c = document.createElement('canvas'); c.width = 260; c.height = 120; const g = c.getContext('2d'); g.fillStyle = '#00ff00'; g.fillRect(0, 0, 260, 120);
        g.setTransform(k, 0, 0, k, 7.3, 30.6); World.drawStruct(g, a, 0, 0, 0); World.drawStruct(g, b, 32, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
        const y = Math.round(30.6 + 18 * k); let green = 0; for (let x = Math.round(7.3 + 24 * k); x < Math.round(7.3 + 40 * k); x++) { const d = g.getImageData(x, y, 1, 1).data; if (d[1] > 200 && d[0] < 80) green++; }
        ok(!green, `no zoom ${k} há fresta entre os trechos da muralha`);
      }
      // sem sino e sem a página de avisos
      UIP.bell(); ok(!document.getElementById('alertBell'), 'o sino de avisos ainda aparece');
      UI.sel.knav = 'overview'; UI.showKingdom(); ok(!UI.panel.querySelector('[data-k="x:alerts"]'), 'a janela de Avisos ainda está no Portfólio');
      UI.sel.knav = 'x:alerts'; UI.showKingdom(); ok(UI.sel.knav === 'overview', 'o atalho dos Avisos não leva à Visão geral');
      UI.close();
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
