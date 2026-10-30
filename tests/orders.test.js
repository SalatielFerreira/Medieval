// Sociedades secretas (as Guildas e as Ordens de cavalaria juntas): só por convite, graus por missões, manto e cavaleiros,
// irmãos poderosos que protegem (multa e prisão), investimentos, exército, segredos, juramento e fundar a sua.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      ok(Object.keys(KORDERS).length === 7 && KORDERS.smiths && KORDERS.merchants, 'as sete sociedades não existem');
      ok(KOrders.why('smiths'), 'entrou sem ter os requisitos');
      P.level = 10; G.fame = 200; G.piety = 50; P.gold = 20000;
      ok(/convidado/.test(KOrders.why('smiths') || ''), 'entrou sem convite');
      UI.sel.knav = 'x:ordens'; UI.showKingdom(); ok(html().includes('Cavaleiros Templários') && html().includes('Sociedades secretas') && html().includes('Fundar a sua'), 'página das sociedades');
      // os irmãos: os do ofício e os poderosos
      ok(Secret.brothers('smiths').length > 0, 'a sociedade não tem irmãos');
      { const b = UI.panel.querySelector('.snav-body'); ok(b.scrollHeight <= b.clientHeight + 1, 'a página das sociedades não cabe na janela'); }
      // o convite: um irmão amigo
      const bro = Secret.brothers('smiths').find(p => p.age >= 16); bro.met = true; bro.aff = 50;
      Secret.ask('smiths'); ok(Secret.S().invites.smiths, 'o irmão amigo não convidou');
      Secret.accept('smiths'); ok(KOrders.S().key === 'smiths' && KOrders.S().mission && KOrders.rankName() === 'Aprendiz', 'não entrou como Aprendiz');
      ok(Commerce.st().member === 'smiths', 'a guilda do ofício não virou a sociedade');
      UI.showKingdom(); ok(html().includes('Você é Aprendiz') && html().includes('O que a sociedade faz por você'), 'a página do irmão');
      // missões até Companheiro: o manto e o cavaleiro
      for (let k = 0; k < 2; k++) { KOrders.S().mission = { k: 'bandits', until: G.day + 3, base: Progress.S().kill_bandit || 0 }; Progress.add('kill_bandit', 8); KOrders.monthTick(); }
      ok(KOrders.rank() === 1 && KOrders.rankName() === 'Companheiro', 'não subiu a Companheiro: ' + KOrders.rankName());
      ok(Inv.count('ko_tabard_smiths') && Inv.count('ko_helm_smiths'), 'não ganhou o manto');
      ok(KOrders.knights().length === 1, 'nenhum cavaleiro da sociedade');
      // investimentos: os empreendimentos rendem mais
      const s = { type: 'biz_smithy', workers: [] }; const f0 = Biz.forecast.call(Biz, s);
      ok(f0 && typeof f0.gold === 'number', 'a previsão dos empreendimentos quebrou');
      // proteção: um rei irmão corta a multa pela metade
      const c = G.civs.find(x => !x.dead && x.ruler !== 'player' && x.rulerId != null); const king = G.people[c.rulerId]; const old = king.soc; king.soc = 'smiths';
      const w0 = (Crime.W()[c.id] || { bounty: 0 }).bounty; KOrders.S().viol = -10; Crime.commit(c.id, 'furto', 100, null, null, true);
      ok((Crime.W()[c.id].bounty - w0) === 50, 'o rei irmão não cortou a multa: ' + (Crime.W()[c.id].bounty - w0));
      ok(Prison.sentence(c.id, 600).brother === king, 'o rei irmão não encurtou a pena');
      king.soc = old;
      // segredos (Companheiro ou mais)
      G.assassins = 2; const t = Secret.secret(); ok(typeof t === 'string' && t.length > 5, 'não há segredos');
      // doação
      KOrders.S().mission = { k: 'donate', until: G.day + 3, base: 0 }; const g0 = P.gold; KOrders.donate(); ok(P.gold === g0 - 250 && KOrders.S().pts === 3, 'a doação não contou');
      // juramento (Templários são estritos): três crimes e é expulso
      KOrders.S().viol = 0;
      for (let k = 0; k < 3; k++) Crime.commit(1, 'furto', 20, null, null, true);
      ok(!KOrders.S().key && !KOrders.knights().length, 'não foi expulso depois de 3 quebras');
      ok(KOrders.why('smiths'), 'voltou para a sociedade que o expulsou');
      // Negócios: a aba Guildas virou as sociedades
      UI.showBizBoard('guilds'); ok(UI.sel.knav === 'x:ordens', 'a aba Guildas não levou às sociedades');
      // fundar a sua
      Game.becomeRuler(1, 't'); UI.close();
      KOrders.found('Irmandade do Sol', KO_COLORS[1]); ok(KOrders.S().key === 'own' && KOrders.rank() === 3 && KOrders.knights().length >= 1, 'não fundou a sociedade');
      KOrders.monthTick(); ok(KOrders.S().own.knights === 2, 'a sociedade não armou cavaleiro novo');
      UI.sel.knav = 'x:ordens'; UI.showKingdom(); ok(html().includes('Irmandade do Sol'), 'a página não mostra a sua sociedade');
      return bad;
    });
    fails.push(...r);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const k = await page.evaluate(() => [KOrders.S().key, !!ITEMS.ko_tabard_own, KOrders.knights().length]);
    if (k[0] !== 'own' || !k[1] || !k[2]) fails.push('a sociedade não voltou ao carregar: ' + JSON.stringify(k));
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
