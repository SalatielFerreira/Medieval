// Muralhas das vilas contínuas (árvore ou pedra no caminho sai; só a estrada, a água e construções abrem vão),
// trechos emendados sem fresta e o sino e a janela de avisos fora do jogo.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      World.villages.forEach(v => { v.level = 10; }); Towns.applyAll();
      World.villages.forEach((v, vi) => {
        const W = World.structs.filter(s => s && !s.removed && s.type === 'vwall' && s.village === vi && !s.hidden);
        if (!W.length) return;
        const at = (x, y) => World.wallAt(x, y);
        // trecho solto (sem nenhum vizinho) só pode ficar ao lado de estrada, água ou construção
        const loose = W.filter(s => !(at(s.x - 1, s.y) || at(s.x + 1, s.y) || at(s.x, s.y - 1) || at(s.x, s.y + 1)));
        ok(loose.length <= 2, `${v.name}: ${loose.length} trechos de muralha soltos`);
        ok(!W.some(s => { const o = World.obj[World.idx(s.x, s.y)]; return o && OBJ[o].blocks; }), `${v.name}: árvore ou pedra em cima da muralha`);
      });
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
