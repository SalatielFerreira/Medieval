// Ordens de cavalaria: requisitos, juramento, missões, patentes, armadura, cavaleiros que seguem, expulsão e fundar a sua.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      ok(KOrders.why('templo'), 'entrou sem ter os requisitos');
      P.level = 10; G.fame = 200; G.piety = 50; P.gold = 20000;
      UI.sel.knav = 'x:ordens'; UI.showKingdom(); ok(html().includes('Ordem do Templo') && html().includes('Fundar a sua ordem'), 'página das ordens');
      KOrders.join('templo'); ok(KOrders.S().key === 'templo' && KOrders.S().mission, 'não entrou na ordem');
      // missões até Cavaleiro
      for (let k = 0; k < 2; k++) { KOrders.S().mission = { k: 'bandits', until: G.day + 3, base: Progress.S().kill_bandit || 0 }; Progress.add('kill_bandit', 8); KOrders.monthTick(); }
      ok(KOrders.rank() === 1, 'não subiu a Cavaleiro: ' + KOrders.rankName());
      ok(Inv.count('ko_tabard_templo') && Inv.count('ko_helm_templo'), 'não ganhou a armadura');
      ok(KOrders.knights().length === 1, 'nenhum cavaleiro da ordem');
      Game.equip('ko_tabard_templo'); ok(P.equip.torso === 'ko_tabard_templo', 'a armadura não veste');
      // doação
      KOrders.S().mission = { k: 'donate', until: G.day + 3, base: 0 }; const g0 = P.gold; KOrders.donate(); ok(P.gold === g0 - 250 && KOrders.S().pts === 3, 'a doação não contou');
      // juramento: três crimes e é expulso
      for (let k = 0; k < 3; k++) Crime.commit(1, 'furto', 20, null, null, true);
      ok(!KOrders.S().key && !KOrders.knights().length, 'não foi expulso depois de 3 quebras');
      ok(KOrders.why('templo'), 'voltou para a ordem que o expulsou');
      // fundar a sua
      Game.becomeRuler(1, 't'); UI.close();
      KOrders.found('Ordem do Sol', KO_COLORS[1]); ok(KOrders.S().key === 'own' && KOrders.rank() === 3 && KOrders.knights().length >= 1, 'não fundou a ordem');
      KOrders.monthTick(); ok(KOrders.S().own.knights === 2, 'a ordem não armou cavaleiro novo');
      UI.sel.knav = 'x:ordens'; UI.showKingdom(); ok(html().includes('Ordem do Sol'), 'a página não mostra a sua ordem');
      return bad;
    });
    fails.push(...r);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const k = await page.evaluate(() => [KOrders.S().key, !!ITEMS.ko_tabard_own, KOrders.knights().length]);
    if (k[0] !== 'own' || !k[1] || !k[2]) fails.push('a ordem não voltou ao carregar: ' + JSON.stringify(k));
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
