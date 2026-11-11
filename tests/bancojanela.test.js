// Janela do banco em tela cheia: cada aba cabe sem rolar (no computador e no celular deitado), listas compridas
// viram páginas dentro do cartão. Junto: a guarnição (até 50; pelo reino circulam no máximo 10, a reserva repõe quem
// cai) e "Poucas" pessoas nas ruas = 20 por vila.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const fails = [];
  for (const [w, h, nm] of [[1366, 720, 'computador'], [844, 390, 'celular']]) {
    const { page, errors, close } = await open({ width: w, height: h });
    try {
      const out = await page.evaluate(nm => {
        const out = [], ok = (c, t) => { if (!c) out.push(`${nm}: ${t}`); };
        UI.msg = () => {}; P.god = true; P.gold = 30000;
        Game.becomeRuler(1, 'teste'); UI.close();
        Bank.B().acc[1] = 3000; Bolsa.renda(1, 1000); Bolsa.buy('sal', 10);
        for (const [t] of BANK_TABS) {
          UI.showBank(1, t);
          const el = UI.panel.querySelector('.bk3-body');
          ok(el, `${t}: sem a janela nova`); if (!el) continue;
          ok(!el.classList.contains('scroll') && el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2, `${t}: precisa rolar (${el.scrollHeight}/${el.clientHeight})`);
          ok(UI.panel.querySelector(`.bk3-tab.on[data-t="${t}"]`), `${t}: a aba não aparece marcada`);
          // as páginas das listas funcionam
          const pg = UI.panel.querySelector('.bk3-pager:not([hidden]) button[data-d="1"], .bk3-cpager button[data-d="1"]');
          if (pg) { const lab = pg.parentElement.querySelector('span').textContent; pg.click(); ok(pg.parentElement.querySelector('span').textContent !== lab, `${t}: a seta de página não muda a página`); }
        }
        // um botão da janela continua funcionando (depositar)
        UI.showBank(1, 'conta'); const a0 = Bank.acc(1); const b = UI.panel.querySelector('button[data-op="dep"][data-n="100"]'); ok(b, 'sem botão de depositar');
        if (b) { b.click(); ok(Bank.acc(1) === a0 + 100, 'depositar pela janela nova não funcionou'); ok(UI.panel.querySelector('.bk3-body'), 'depois de depositar a janela voltou para a antiga'); }
        UI.close();
        if (nm === 'computador') {
          // guarnição
          ok(Game.maxGarrison(G.civs[2]) === 50, 'a guarnição máxima não é 50');
          const c = G.civs[2], tot = pl => pl.cap + pl.patrol + Object.values(pl.v).reduce((a, n) => a + n, 0);
          c.garrison = 13; ok(tot(Garrison.plan(2)) === 10, '13 soldados: pelo reino deviam circular 10, circulam ' + tot(Garrison.plan(2)));
          c.garrison = 11; ok(tot(Garrison.plan(2)) === 10, '11 soldados: deviam circular 10');
          c.garrison = 9; ok(tot(Garrison.plan(2)) === 9, '9 soldados: deviam circular 9, circulam ' + tot(Garrison.plan(2)));
          c.garrison = 50; ok(tot(Garrison.plan(2)) === 10, '50 soldados: deviam circular 10');
          // um soldado que circula morre: a guarnição cai 1 e a reserva repõe (o plano continua com 10)
          c.garrison = 13; const cp = World.capitals[2]; P.x = (cp.x + 0.5) * TILE; P.y = (cp.y + 9) * TILE;
          for (let k = 0; k < 60; k++) Game.update(0.05);
          const gs = G.ents.filter(e => !e.dead && e.kind === 'guard' && e.civ === 2 && /^(cap|vg|gp)/.test(e.tag || ''));
          ok(gs.length > 0 && gs.length <= 10, 'soldados do reino por perto: ' + gs.length);
          if (gs[0]) { Game.kill(gs[0], null); ok(c.garrison === 12, 'a morte não tirou o soldado da guarnição: ' + c.garrison); }
          // poucas pessoas nas ruas
          ok(STREET_CAP.few === 20, 'Poucas pessoas não é 20');
          // a base de cimento embaixo das construções (e não nos muros)
          const hs = World.structs.find(x => x && !x.removed && !x.hidden && x.type === 'vhouse');
          ok(hs && BASES.of(hs.x, hs.y) === hs, 'a casa da vila não tem base');
          const wl = World.structs.find(x => x && !x.removed && !x.hidden && x.type === 'vwall'); ok(!wl || !BASES.of(wl.x, wl.y), 'o muro ganhou base');
          const cv = document.createElement('canvas'); cv.width = cv.height = HALF; const g = cv.getContext('2d');
          if (hs) { World.paintTile(g, hs.x, hs.y, 0, 0); const d = g.getImageData(HALF / 2 - 2, HALF / 2 - 2, 1, 1).data; ok(Math.abs(d[0] - d[1]) < 20 && Math.abs(d[1] - d[2]) < 25 && d[0] > 150, 'a base não é cinza-clara: ' + [...d].slice(0, 3)); }
        }
        return out;
      }, nm);
      fails.push(...out);
      if (errors.length) fails.push(`${nm}: erros: ` + errors.slice(0, 3).join(' | '));
    } finally { await close(); }
  }
  return fails;
};
