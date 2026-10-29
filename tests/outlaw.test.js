// Fora da lei: assumir um bando num acampamento, bandidos deixam de atacar (menos caçadores), assaltar caravana e
// saquear vila sobem a recompensa, proteção rende, caçadores aparecem, perdão comprado limpa o reino; salvar guarda o bando.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 20000; P.level = 12;
      const camp = World.camps.find(c => !c.cleared); P.x = (camp.x + 1.5) * TILE; P.y = (camp.y + 5) * TILE;
      OutLaw.start(); ok(G.outlaw && camp.hideout, 'não assumiu o bando');
      const b = Game.spawn('bandit', P.x + 30, P.y, {}); ok(!hostile(b, P), 'o bandido ainda ataca o chefe');
      b.bounty = true; ok(hostile(b, P), 'o caçador de recompensa não ataca');
      UI.sel.knav = 'x:outlaw'; UI.showKingdom(); ok(html().includes('O bando de'), 'página do bando');
      // golpes (sorte a favor)
      const rnd = Math.random; Math.random = () => 0.01;
      try {
        if (!Caravans.list().length) Caravans.list().push({ id: 77, from: 2, to: 3, path: [0, 1, 2], pos: 0, done: false, robbed: false, escort: 0, goods: [{ k: 'spices', n: 3 }] });
        const car = OutLaw.caravans()[0], g0 = P.gold, r1 = OutLaw.robCaravan(car.id);
        ok(r1 && r1.ok && P.gold > g0 && Crime.wanted(car.from), 'o assalto à caravana não deu certo');
        const vi = World.villages.findIndex(v => v && v.lord !== 'player'); const r2 = OutLaw.raid(vi);
        ok(r2 && r2.ok && World.villages[vi].sacked === G.day, 'o saque não deu certo');
        OutLaw.protect(vi); G.outlaw.fame = 50; const g1 = P.gold; OutLaw.monthTick(); ok(P.gold > g1, 'a proteção não rendeu');
        ok(G.ents.some(e => e.bounty && !e.dead && e.name === 'Caçador de Recompensas') || OutLaw.totalBounty() <= 300, 'nenhum caçador de recompensa veio');
      } finally { Math.random = rnd; }
      // perdão
      const ci = OutLaw.wanted()[0].ci; P.gold = 1e6; OutLaw.pardon(ci); ok(!Crime.wanted(ci), 'o perdão não limpou o reino');
      // interagir com o esconderijo
      Game.useStruct(camp); ok(UI.cur && UI.cur.fn === 'showKingdom', 'o esconderijo não abre a página');
      return bad;
    });
    fails.push(...r);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const k = await page.evaluate(() => [!!G.outlaw, !!OutLaw.hideout() && OutLaw.hideout().hideout]);
    if (!k[0] || !k[1]) fails.push('o bando não voltou ao carregar: ' + JSON.stringify(k));
    await page.evaluate(() => OutLaw.quit()); const q = await page.evaluate(() => G.outlaw); if (q) fails.push('não largou a vida de fora da lei');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
