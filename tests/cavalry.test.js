// Montaria em combate (galope dá força, carga de lança empurra, arco montado) e companheiros com história (lealdade,
// pedidos, partida quando a lealdade acaba, amor entre os capangas).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 5000;
      // carga de lança
      const mk = () => { const e = Game.spawn('bandit', P.x + 30, P.y, { leash: 1 }); e.maxHp = e.hp = 5000; return e; };
      Inv.add('cavalry_lance', 1); Game.equip('cavalry_lance');
      let e = mk(); P.mounted = false; Game.damage(e, 20, P); const foot = 5000 - e.hp;
      e = mk(); P.horse = P.horse || { name: 'Teste', color: '#7a4a26' }; P.mounted = true; P.gallop = 2; const x0 = e.x; Game.damage(e, 20, P); const charge = 5000 - e.hp;
      ok(charge > foot * 1.6, `a carga de lança não foi mais forte (${foot} → ${charge})`); ok(e.x > x0, 'a carga não empurrou o inimigo');
      ok(P.gallop === 0, 'a carga não gastou o embalo');
      Inv.add('short_bow', 1); Game.equip('short_bow'); e = mk(); Game.damage(e, 20, P); ok(5000 - e.hp > 20, 'o arco montado não ficou mais forte');
      P.mounted = false;
      // companheiros
      const c = People.create({ rank: 'peasant', age: 25, trait: 'ganancioso', home: { type: 'village', idx: 0 }, civ: World.villages[0].civ }); c.capanga = true;
      ok(COMP.loyal(c) === 45, 'lealdade inicial do ganancioso');
      COMP.ask(c); ok(c.favor, 'o capanga não fez pedido');
      c.favor = { k: 'gold', day: G.day, until: G.day + 2 }; const g0 = P.gold, l0 = COMP.loyal(c); COMP.grant(c);
      ok(P.gold < g0 && COMP.loyal(c) > l0 && !c.favor, 'atender o pedido não subiu a lealdade');
      c.favor = { k: 'feast', day: G.day, until: G.day + 2 }; const l1 = COMP.loyal(c); COMP.decline(c); ok(COMP.loyal(c) < l1, 'recusar não baixou a lealdade');
      // na conversa
      c.favor = { k: 'gold', day: G.day, until: G.day + 2 }; const acts = []; Lifesim.acts(c, acts); ok(acts.some(a => a[0] === 'cFavor'), 'o pedido não aparece na conversa');
      // pedido esquecido
      c.favor = { k: 'hunt', day: G.day - 5, until: G.day - 1 }; const l2 = COMP.loyal(c); COMP.monthTick(); ok(COMP.loyal(c) < l2 || !c.capanga, 'esquecer o pedido não pesou');
      // lealdade no fim: vai embora
      c.loyal = 0; const rnd = Math.random; Math.random = () => 0.01; try { COMP.monthTick(); } finally { Math.random = rnd; }
      ok(!c.capanga, 'o capanga sem lealdade não foi embora');
      // amor entre capangas
      const a = People.create({ rank: 'peasant', age: 24, sex: 'm', trait: 'leal' }), b = People.create({ rank: 'peasant', age: 23, sex: 'f', trait: 'leal' });
      a.capanga = b.capanga = true; a.loyal = b.loyal = 90; Math.random = () => 0.01; try { COMP.monthTick(); } finally { Math.random = rnd; }
      ok(a.spouse === b.id, 'os capangas apaixonados não se casaram');
      ok(People.capangaStats(a).loyal >= 90, 'a lealdade não aparece na ficha');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
