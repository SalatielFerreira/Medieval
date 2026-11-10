// O rei muda a prisão do reino de lugar (como o banco, a catedral e a arena): quem não governa não pode; depois de
// mudada, o carcereiro, o interior e os presos continuam, e salvar e carregar mantém o lugar novo.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const ci = 1, pr = Prison.of(ci); ok(pr, 'o reino não tem prisão'); if (!pr) return { out };
      ok(Urban.movable(pr), 'quem não governa conseguiu mexer na prisão');
      Game.becomeRuler(ci, 'teste'); UI.close();
      ok(!Urban.movable(pr), 'o rei não pode mudar a prisão: ' + Urban.movable(pr));
      ok(Urban.movable(Prison.of(0)), 'dá para mexer na prisão de outro reino');
      const keeper0 = Shops.keeper(pr);
      // um lugar livre no reino, longe dali
      let sp = null; for (let r = 15; r < 80 && !sp; r += 2) for (let k = 0; k < 24 && !sp; k++) { const x = Math.round(pr.x + Math.cos(k / 24 * 6.28) * r), y = Math.round(pr.y + Math.sin(k / 24 * 6.28) * r); if (!Urban.placeErr(pr, x, y, pr, Urban.isCivic(pr))) sp = { x, y }; }
      ok(sp, 'não achou lugar livre para a prisão'); if (!sp) return { out };
      Urban.relocate(pr, sp.x, sp.y);
      ok(pr.x === sp.x && pr.y === sp.y && !pr.removed, 'a prisão não mudou de lugar');
      ok(Prison.of(ci) === pr, 'o reino perdeu a prisão depois da mudança');
      ok(!keeper0 || Shops.keeper(pr) === keeper0, 'o carcereiro perdeu a prisão');
      ok(Places.enterRoom(pr) && G.place && G.place.type === 'prison', 'não dá para entrar na prisão no lugar novo'); Places.exit(true);
      window._pr = { x: sp.x, y: sp.y }; Game.save(null);
      return { out, slot: G.slot };
    });
    fails.push(...a.out);
    if (a.slot) {
      await page.evaluate(s => Game.load(s), a.slot);
      await page.waitForFunction(() => G.state === 'play', { timeout: 60000 });
      const b = await page.evaluate(() => { const pr = Prison.of(1); return pr ? { x: pr.x, y: pr.y, want: window._pr, n: World.structs.filter(s => s && !s.removed && s.type === 'prison' && s.owner === 1).length } : null; });
      if (!b || b.x !== b.want.x || b.y !== b.want.y) fails.push('depois de carregar, a prisão voltou para o lugar antigo: ' + JSON.stringify(b));
      else if (b.n !== 1) fails.push(`depois de carregar há ${b.n} prisões no reino`);
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
