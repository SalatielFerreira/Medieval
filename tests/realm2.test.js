// Estações e clima, tratados (casamento entre dinastias, comércio, tributos e reféns), árvore da dinastia e painel do reino.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      const rnd = Math.random, day0 = G.day, monthOf = s => { for (let d = G.day; d < G.day + 24; d++) if (Season.idx(d) === s) return d; return G.day; };
      // ---------------- clima
      const food = Object.keys(ITEMS).find(k => ITEMS[k].cat === 'Comida' && ITEMS[k].price >= 5);
      G.day = monthOf(1); Clima.S().w[0] = 'normal'; Clima.S().day = G.day; const summer = Game.price(0, food).buy;
      G.day = monthOf(3); Clima.S().w[0] = 'normal'; Clima.S().day = G.day; const winter = Game.price(0, food).buy;
      ok(winter > summer, `comida não ficou mais cara no inverno (${summer} → ${winter})`);
      const road = World.tiles.findIndex(t => t === T.ROAD), rx = (road % WORLD_W) * TILE + 16, ry = Math.floor(road / WORLD_W) * TILE + 18;
      const wSpd = World.speedAt(rx, ry); G.day = monthOf(1); Clima.S().day = G.day; for (const c of G.civs) Clima.S().w[c.id] = 'normal';
      const sSpd = World.speedAt(rx, ry); ok(wSpd < sSpd, `estrada não ficou lenta no inverno (${sSpd} → ${wSpd})`);
      G.day = monthOf(2); const v = World.villages.find(x => x && !x.free), p0 = v.prosper = 20, ci = v.civ, t0 = G.civs[ci].treasury;
      Clima.S().day = -1; Clima.monthTick(); ok(v.prosper > p0, 'a colheita não enriqueceu a vila'); ok(G.civs[ci].treasury > t0, 'o imposto da colheita não entrou');
      // a chuva atrapalha quem ataca
      Diplo.D().wars = Diplo.D().wars.filter(w => !(w.a === 3 || w.b === 3 || w.a === 4 || w.b === 4)); Diplo.D().wars.push({ a: 3, b: 4, since: G.day });
      Clima.S().w[4] = 'tempestade'; Clima.S().day = G.day; const wx = War.weather({ side: 3, enemy: 4 }); ok(wx.mine < 1 && wx.foe === 1, 'a tempestade não atrapalhou quem ataca');
      Clima.S().w[4] = 'normal';
      Diplo.D().wars = Diplo.D().wars.filter(w => !(w.a === 3 && w.b === 4));
      UI.sel.knav = 'x:clima'; UI.showKingdom(); ok(html().includes('O tempo deste mês'), 'página das estações');
      G.day = day0; Clima.S().day = -1;
      // ---------------- árvore da dinastia (sem reino ainda)
      Game.birth('Aurora', 'f'); const kid = G.people[G.people.length - 1]; ok(kid.heroGen === 0, 'o filho não ganhou a geração');
      kid.age = 18; const T0 = Lineage.tree(); ok(T0.length === 1 && T0[0].kids.some(k => k.p === kid), 'o filho não está na árvore');
      ok(Book.pages()[1].includes('A árvore da Casa'), 'o livro não tem a página da árvore');
      UI.showLineage(); ok(html().includes('Aurora') && html().includes('1ª geração'), 'janela da árvore');
      // ---------------- casamento entre dinastias
      const heir = People.create({ rank: 'heir', civ: 5, sex: 'm', age: 20, home: { type: 'castle', civ: 5 } });
      G.civs[5].relation = 60; G.civs[5].treasury = 2000; Math.random = () => 0.01; try { Pacts.wed(kid.id, 5); } finally { Math.random = rnd; }
      ok(kid.spouse !== null && G.people[kid.spouse].rank === 'heir' && G.people[kid.spouse].civ === 5 && heir && kid.home.type === 'castle' && kid.home.civ === 5, 'o casamento entre dinastias não aconteceu');
      ok(G.civs[5].treasury < 2000, 'o dote não saiu do tesouro');
      // ---------------- tratados (como rei)
      Game.becomeRuler(1, 'teste'); UI.close(); G.mainRealm = 1; const m = Pacts.main(); ok(m === 1, 'reino principal');
      for (const w of Diplo.D().wars.slice()) if (w.a === 1 || w.b === 1) Diplo.makePeace(w.a, w.b);
      Diplo.D().rel[1][2] = Diplo.D().rel[2][1] = 40; G.civs[1].treasury = 5000;
      Pacts.askTrade(2); ok(Pacts.trade(1, 2), 'o tratado de comércio não foi assinado');
      const a1 = G.civs[1].treasury, a2 = G.civs[2].treasury; Pacts.monthTick(); ok(G.civs[1].treasury > a1 && G.civs[2].treasury > a2, 'o comércio não rendeu aos dois tesouros');
      const pr = Game.priceFor(2, food, { aff: 0 }).buy; Pacts.S().trade = []; const pr2 = Game.priceFor(2, food, { aff: 0 }).buy; ok(pr <= pr2, 'o tratado não deu desconto');
      // tributo
      G.civs[1].garrison = 200; G.civs[3].garrison = 1; G.civs[3].treasury = 3000; Diplo.D().rel[1][3] = Diplo.D().rel[3][1] = 0;
      Math.random = () => 0.01; try { Pacts.demand(3); } finally { Math.random = rnd; }
      ok(Pacts.tribOf(3, 1), 'o reino fraco não aceitou o tributo');
      const b1 = G.civs[1].treasury; Pacts.monthTick(); ok(G.civs[1].treasury > b1, 'o tributo não foi pago');
      // reféns: paz com refém; a IA que entregou o refém não ataca
      const host = People.create({ rank: 'heir', civ: 4, age: 15, home: { type: 'castle', civ: 4 } });
      Diplo.declareWar(1, 4, 'teste'); G.civs[4].garrison = 1; Math.random = () => 0.01; try { Pacts.peaceHostage(4); } finally { Math.random = rnd; }
      ok(!Diplo.atWar(1, 4) && Pacts.bound(4, 1), 'a paz com refém não aconteceu');
      Diplo.declareWar(4, 1, 'teste'); ok(!Diplo.atWar(4, 1), 'a IA atacou mesmo com o refém');
      // o seu filho refém morre se você atacar quem o guarda
      Game.birth('Bento', 'm'); const kid2 = G.people[G.people.length - 1]; kid2.age = 16;
      Diplo.declareWar(1, 6, 'teste'); Math.random = () => 0.01; try { Pacts.offerHostage(kid2.id, 6); } finally { Math.random = rnd; }
      ok(!Diplo.atWar(1, 6) && Pacts.bound(1, 6), 'entregar o filho como refém não trouxe a paz');
      Diplo.declareWar(1, 6, 'teste'); ok(!kid2.alive, 'o refém não morreu quando você atacou');
      UI.sel.knav = 'x:pacts'; UI.showKingdom(); ok(html().includes('Casamento entre dinastias') && html().includes('Tratados de'), 'página dos tratados');
      // ---------------- painel do reino
      Board.record(); G.day++; G.civs[1].treasury += 500; Board.record();
      const H = Board.hist(1); ok(H.length >= 2 && H[H.length - 1].tre > H[H.length - 2].tre - 1, 'histórico do painel');
      ok(Board.threats(1).some(t => /Guerra/.test(t.t)), 'a guerra não aparece nas ameaças');
      UI.sel.rbCiv = 1; UI.sel.knav = 'x:painel'; UI.showKingdom(); ok(html().includes('rb-chart') && html().includes('Ameaças'), 'página do painel');
      ok(html().includes('Painel do reino') && html().includes('Tratados') && html().includes('Estações e clima'), 'os itens novos não estão no Portfólio');
      // salvar guarda os tratados, o clima e o painel
      const before = JSON.stringify([Pacts.sig(), Clima.kind(1), Board.S()[1].length]);
      return { bad, before };
    });
    fails.push(...r.bad);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const after = await page.evaluate(() => JSON.stringify([Pacts.sig(), Clima.kind(1), Board.S()[1].length]));
    if (after !== r.before) fails.push(`tratados, clima ou painel mudaram ao carregar: ${r.before} → ${after}`);
    // no celular
  } finally { await close(); }
  const M = await open({ width: 390, height: 844 });
  try {
    for (const nav of ['x:painel', 'x:pacts', 'x:clima']) {
      const wide = await M.page.evaluate(nav => { UI.sel.knav = nav; UI.showKingdom(); const b = UI.panel.querySelector('.kpg') || UI.panel; return b.scrollWidth - b.clientWidth; }, nav);
      if (wide > 4) fails.push(`${nav} passa da largura no celular (${wide}px)`);
    }
    await M.page.evaluate(() => UI.showLineage());
  } finally { await M.close(); }
  fails.push(...M.errors.map(e => 'erro no celular: ' + e));
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
