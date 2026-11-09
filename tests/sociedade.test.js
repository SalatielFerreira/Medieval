// Sociedades secretas: a amizade com um irmão comanda o convite (100 = garantido, mesmo sem nível e fama), dá para
// sair e voltar (convite de um amigo a partir do mês seguinte), expulso só volta com amizade 100, e na conversa com um
// irmão dá para pedir para entrar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.banner = () => {}; Dialog.autoYes = true; P.level = 1; G.fame = 0;
      Secret.seed();
      const k = Object.keys(SECRET_SOC).find(x => Secret.brothers(x).length >= 2), p = Secret.brothers(k)[0];
      ok(k && p, 'não há irmãos para o teste'); if (!p) return out;
      for (const q of G.people) if (q !== p && q.aff > 10) q.aff = 0; // ninguém mais ajuda
      p.met = true; p.alive = true;
      // amizade baixa: sem convite
      p.aff = 30; Secret.monthTick(); ok(!Secret.S().invites[k], 'com amizade 30 veio convite');
      // amizade 100: convite garantido, mesmo no nível 1 e sem fama
      p.aff = 100; Secret.monthTick(); ok(Secret.S().invites[k], 'com amizade 100 o convite não veio');
      Secret.accept(k); ok(KOrders.S().key === k, 'aceitou o convite e não entrou (nível 1, sem fama)');
      // sair e voltar: no mesmo mês não; no mês seguinte, o amigo convida de novo
      KOrders.leave(); ok(!Secret.member(), 'não saiu da sociedade');
      Secret.monthTick(); ok(!Secret.S().invites[k], 'convidou no mesmo mês em que você saiu');
      G.day++; Secret.monthTick(); ok(Secret.S().invites[k], 'saiu e o amigo de amizade 100 não convidou de volta');
      Secret.accept(k); ok(KOrders.S().key === k, 'não voltou para a sociedade');
      // expulso: amizade 90 não basta; 100 basta
      KOrders.leave(`expulso da ${SECRET_SOC[k].name}: um crime`); G.day++;
      p.aff = 90; Secret.S().invites = {}; for (let i = 0; i < 8; i++) Secret.monthTick(); ok(!Secret.S().invites[k], 'expulso, um amigo de amizade 90 convidou');
      p.aff = 100; Secret.monthTick(); ok(Secret.S().invites[k], 'expulso, o amigo de amizade 100 não convidou');
      Secret.S().invites = {};
      // na conversa com o irmão: pedir para entrar
      UI.showTalk(p.id); ok(UI.panel.querySelector('[data-op="scask"]'), 'na conversa com o irmão falta "Pedir para entrar"');
      UI.talkAct({ op: 'scask', id: p.id }); ok(Secret.S().invites[k], 'pedir na conversa (amizade 100) não deu convite');
      UI.close();
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
