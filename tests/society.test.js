// Sociedade: rede de amizades com cascata, reputação por grupo, níveis de amizade e benefícios, romance (atenção,
// ciúme, divórcio, dote, casamento arranjado), banquete e convites, segredos, duelo de honra, eleição e jantar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true;
      P.god = true; P.gold = 20000;
      const vil = G.people.filter(p => p.alive && p.age >= 18 && !p.kin && p.home.type === 'village');
      // 1. rede e cascata
      const a = vil.find(p => Society.circle(p).friends.length && Society.circle(p).foes.length) || vil[0];
      const c = Society.circle(a), f0 = c.friends[0] ? c.friends[0].aff : 0, e0 = c.foes[0] ? c.foes[0].aff : 0;
      People.addAff(a, 20);
      ok(!c.friends[0] || c.friends[0].aff > f0, 'ajudar não agradou os amigos da pessoa');
      ok(!c.foes[0] || c.foes[0].aff < e0, 'ajudar não irritou os desafetos');
      UI.showTalk(a.id); ok(UI.panel.innerHTML.includes('Melhor amigo') || UI.panel.innerHTML.includes('Desafetos'), 'a ficha não mostra a rede de amizades'); UI.close();
      // 2. reputação
      const pr = vil.find(p => p.rank === 'priest'); if (pr) ok(Society.groupOf(pr) === 'clero', 'padre não é do clero');
      Society.rep('mercadores', 40); const sh = vil.find(p => p.rank === 'merchant') || vil[1];
      const pg = Game.priceFor(0, 'bread', sh).buy; Society.S().rep.mercadores = -40; ok(Game.priceFor(0, 'bread', sh).buy > pg, 'reputação com mercadores não mexe no preço'); Society.S().rep.mercadores = 0;
      // 3. níveis de amizade
      const b = vil[3]; b.aff = 92; ok(People.relation(b).text.startsWith('Confidente'), 'nível confidente: ' + People.relation(b).text);
      UI.showTalk(b.id); ok(UI.panel.innerHTML.includes('sSecret') && UI.panel.innerHTML.includes('sLoan'), 'o confidente não oferece segredo e empréstimo'); UI.close();
      const g0 = P.gold; Lifesim.talkAct(b, 'sLoan'); ok(P.gold > g0 && b.lent > 0, 'o empréstimo de amigo não veio');
      Lifesim.talkAct(b, 'sSecret'); ok(Society.knows(b), 'o confidente não contou o segredo');
      const rk = Lifesim.talkAct(b, 'sKeep'); ok(rk && !Society.knows(b), 'guardar o segredo não funcionou');
      // 6. segredos: chantagem
      const v2 = vil[5]; Society.learn(v2); v2.purse = 500; Society.S().rep.submundo = 50; const g1 = P.gold; Lifesim.talkAct(v2, 'sBlack'); ok(P.gold > g1, 'a chantagem não rendeu');
      // 4. romance
      const sp = vil.find(p => p.sex !== P.sex && p.spouse === null && p.age < 40 && p !== b); sp.aff = 80; sp.rom = 90; sp.dating = true; Inv.add('silver_ring', 1);
      const gd = P.gold; People.propose(sp); ok(sp.spouse === 'player', 'não casou'); ok(P.gold >= gd, 'dote');
      sp.attn = -10; const r0 = sp.rom; Society.romanceTick(); ok(sp.rom < r0, 'o casamento não esfriou sem atenção');
      const other = vil.find(p => p.sex === sp.sex && p.spouse === null && p !== sp && p.age >= 18); if (other) { other.aff = 50; const rr = sp.rom; for (let k = 0; k < 20 && sp.rom >= rr; k++) { other.flirtDay = -1; People.flirt(other); } ok(sp.rom < rr, 'flertar não causou ciúme'); }
      const dv = Society.divorce(sp); ok(dv && sp.spouse !== 'player', 'o divórcio não funcionou');
      // casamento arranjado
      const kid = People.create({ rank: 'peasant', age: 18, sex: 'm', home: { type: 'player' } }); kid.kin = 'child';
      const bride = vil.find(p => p.sex === 'f' && p.spouse === null && p.age >= 16 && p.age < 30 && p !== sp); if (bride) { bride.aff = 40; const ar = Society.arrange(bride, kid.id); ok(ar && kid.spouse === bride.id, 'o casamento arranjado não aconteceu'); }
      // 5. eventos
      const guests = []; for (const p of vil.slice(6)) if (guests.length < 4 && !guests.some(g => Society.ties(g).foes.includes(p.id) || Society.ties(p).foes.includes(g.id))) guests.push(p); guests.forEach(p => p.aff = 15); Society.banquet(guests.map(p => p.id)); ok(guests.every(p => p.aff > 15), 'o banquete não deu amizade');
      const host = vil.slice(11).find(p => p.alive && p.home.type === 'village' && World.villages[p.home.idx]) || vil[11]; host.aff = 40; Society.invite(host, 'birthday'); ok(Society.S().invites.length, 'convite não chegou');
      const vv = World.villages[host.home.idx]; P.x = vv.x * TILE; P.y = vv.y * TILE; Society.attend(Society.S().invites.find(i => i.pid === host.id)); ok(host.aff > 40, 'comparecer não agradou');
      // 7. duelo de honra
      const rv = vil[12]; rv.rival = true; Society.startDuel(rv); ok(G.honor, 'o duelo não começou');
      Game.damage(G.honor.ent, 99999, P); ok(!G.honor && !rv.rival, 'vencer o duelo não encerrou a rivalidade');
      // 8. eleição
      const vi = 0; Society.run(vi); ok(Society.E(vi).me, 'não se candidatou'); for (const p of People.residents(vi)) p.aff = 95; Society.E(vi).push = 60; World.villages[vi].lord = undefined; Society.election(vi); ok(World.villages[vi].lord === 'player', 'ganhar a eleição não deu o governo');
      // 9. jantar
      const dn = vil[14]; dn.aff = 30; Inv.add('stew', 1); const da = dn.aff; Society.dinner(dn); ok(dn.aff > da, 'o jantar não deu amizade');
      for (const t of ['rep', 'friends', 'events', 'politics', 'secrets']) { Society.show(t); ok(UI.cur && UI.cur.fn === 'showKingdom' && UI.sel.knav === 'x:society' && UI.sel.socTab === t, 'janela não abriu: ' + t); }
      UI.close(); Society.visit(); Society.monthTick(); Game.onNewDay();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
