// Sociedade secreta, parte 2: grau não regride, missões novas, Templo (cofre, investimentos, cargos, networking,
// recrutar), poder das sociedades (derrubar governador e rei, caridade e intimidação) e o medo das famílias.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000; Secret.seed();
      ok(Game.canBuild('soc_temple', 0, 0), 'quem não é de sociedade pode erguer o templo');
      const k = 'crafts', S0 = Secret.S(); S0.invites[k] = { by: (Secret.brothers(k)[0] || {}).id || 0, until: G.day + 3 }; Secret.accept(k);
      ok(Secret.key() === k, 'não entrou na sociedade');
      // grau não regride
      KOrders.S().pts = 5; ok(KOrders.rank() === 2, 'com 5 missões não virou Mestre: ' + KOrders.rank());
      KOrders.S().pts = 1; ok(KOrders.rank() === 2, 'o grau caiu quando os pontos caíram');
      ok(Object.keys(KO_MISSIONS).length >= 16, 'poucas missões: ' + Object.keys(KO_MISSIONS).length);
      // templo
      const tx = Math.round(P.x / TILE) + 5, ty = Math.round(P.y / TILE); World.freeArea(tx, ty, 3, 3);
      const t = World.addStruct('soc_temple', tx, ty, 3, 3, 'player'); ok(Soc2.temple() === t, 'o templo não foi reconhecido');
      ok(/Templo da sociedade/.test(Game.interactLabel(t)), 'o templo não tem aviso de interação');
      Content2.interact(t); ok(UI.cur && UI.cur.fn === 'showTemple', 'o templo não abriu');
      for (const [tab] of Soc2.TABS) { Soc2.show(tab); const el = UI.panel.querySelector('.bk3-body'); ok(el && el.scrollHeight <= el.clientHeight + 2, `aba ${tab} do templo precisa rolar`); }
      // cofre e investimentos
      const S = Soc2.S(); S.vault = 0; KOrders.S().mission = { k: 'soc_vault', until: G.day + 3, base: Progress.S().soc_vault || 0 }; const pts0 = KOrders.S().pts;
      UI.act('tp', { op: 'vin', n: '500' }); ok(S.vault === 500, 'pôr no cofre não funcionou'); ok(KOrders.S().pts === pts0 + 1, 'a missão do cofre não foi cumprida na hora');
      S.vault = 5000; Soc2.invest('terras', 1000); ok(S.inv.terras === 1000 && S.vault === 4000, 'investir pela loja não funcionou');
      Soc2.monthTick(); ok(S.inv.terras >= 1000, 'o investimento em terras perdeu dinheiro');
      // networking e cargos
      Soc2.network(); ok(!Soc2.netOk() && (Progress.S().soc_net || 0) >= 1, 'o networking não aconteceu');
      const bro = Secret.brothers(k).find(p => p.age >= 18); if (bro) { bro.met = true; bro.aff = 60; Soc2.appoint('orador'); ok(Soc2.holder('orador'), 'não nomeou o orador'); }
      // recrutar alguém importante (com sorte)
      const cand = G.people.find(p => p.alive && p.age >= 18 && p.rank === 'knight' && !Secret.ssoc(p) && !Commerce.guildOf(p));
      if (cand) { cand.met = true; cand.aff = 100; const r0 = Math.random; Math.random = () => 0.01; Soc2.recruit(cand.id); Math.random = r0; ok(Secret.ssoc(cand) === k, 'o recrutamento com amizade 100 falhou'); }
      // derrubar governador e rei (com sorte)
      const g = Soc2.govTargets()[0]; if (g) { S.vault = 5000; const r0 = Math.random; Math.random = () => 0.01; Soc2.topGov(g.vi); Math.random = r0; ok(World.villages[g.vi].chief !== g.p.id, 'o governador não caiu'); }
      const c = Soc2.kingTargets()[0]; S.infl = 500;
      if (c) { S.vault = 9000; const old = c.rulerId, r0 = Math.random; Math.random = () => 0.01; Soc2.topKing(c.id); Math.random = r0; ok(c.rulerId !== old && !People.get(old).alive, 'o rei não caiu'); }
      // bem e mal
      S.vault = 2000; const kar = S.karma; Soc2.charity(); ok(S.karma > kar, 'a caridade não melhorou a fama'); Soc2.intimidate(); ok(S.karma < kar + 10, 'intimidar não piorou a fama');
      // o medo das famílias: uma casa fraca não declara guerra
      const fam = Object.values(G.fams || {}).filter(f => !f.player && Families.members(f).length).sort((a, b) => Families.influence(a) - Families.influence(b))[0];
      if (fam) { const p = Families.adults(fam)[0] || Families.members(fam)[0]; p.age = Math.max(p.age, 20); const r = Court.npcWar(p); ok(!r && !Court.isEnemy(fam), `a família fraca declarou guerra (influência ${Families.influence(fam)} < ${Soc2.fearBar()})`); }
      UI.close();
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
