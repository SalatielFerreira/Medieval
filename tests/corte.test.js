// Cidadania e cargos na corte: cidadania livre, cargo e título só no reino da cidadania, exigências com a amizade do
// rei e as sociedades, as tarefas do general (a guerra no campo), do secretário (impostos e investimentos) e do
// conselheiro (leis), a janela Corte e cidadania (no computador e no celular) e os Jogos (palanques dos reis na arena
// do anfitrião, medalhas que honram o reino da cidadania).
'use strict';
const { open } = require('./harness');
const check = async (W, H, fails, tag) => {
  const { page, errors, close } = await open({ width: W, height: H });
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.confirm = (o, y) => y && y(); P.god = true; P.gold = 50000; P.level = 20;
      const rnd = Math.random;
      // fora da janela: nada passa da borda e nada rola
      const fits = name => { const out = [...UI.panel.querySelectorAll('.cd-pg, .cd-pg .card, .cd-of, .cd-k')].filter(e => e.scrollHeight > e.clientHeight + 3 && e.clientHeight > 0).map(e => e.className.split(' ')[0]); ok(!out.length, `${name}: não coube (${out.slice(0, 3).join(', ')})`);
        const pr = UI.panel.getBoundingClientRect(); const fora = [...UI.panel.querySelectorAll('.cd-pg button')].filter(b => { const q = b.getBoundingClientRect(); return q.width && (q.bottom > pr.bottom + 1 || q.right > pr.right + 1); }); ok(!fora.length, `${name}: ${fora.length} botões fora da janela`); };
      const npc = G.civs.filter(c => c.ruler === 'npc' && Cid.king(c.id)), A = npc[0].id, B = npc[1].id, C = npc[2].id;
      const prep = ci => { const c = G.civs[ci]; c.relation = 70; c.atWar = false; Cid.king(ci).aff = 70; (G.service = G.service || {})[ci] = 150; G.fame = 200; };
      // 1. cidadania livre
      ok(Cid.get() === -1, 'o jogo não começa sem cidadania');
      UI.showCorte('cid'); ok(UI.panel.querySelectorAll('.cd-k').length === G.civs.filter(c => c && !c.dead).length, 'a cidadania não mostra todos os reinos'); fits('cidadania');
      Cid.choose(A); ok(Cid.get() === A, 'não virou cidadão');
      // 2. título só no reino da cidadania
      prep(A); prep(B);
      ok(!Court.requestTitle(B) && Court.levelIn(B) < 0, 'ganhou título em outro reino');
      ok(Court.requestTitle(A) && Court.levelIn(A) === 0, 'não ganhou título no seu reino');
      // 3. a corte pede amizade com o rei (e as sociedades pesam)
      Cid.king(A).aff = 0; ok(!Cid.canHold(A, 'advisor'), 'entrou na corte sem amizade com o rei');
      Cid.king(A).aff = 70; ok(Cid.canHold(A, 'advisor') && !Cid.canHold(B, 'advisor'), 'as exigências da corte (cidadania) não valem');
      ok(Cid.ask(A) && RoyalCourt.isMember(A), 'não entrou para a corte');
      RoyalCourt.setOffice('general'); ok(RoyalCourt.C().office === 'general', 'não virou general');
      UI.showCorte('corte'); ok(UI.panel.querySelectorAll('.cd-of').length === 4, 'a corte não mostra os 4 cargos'); fits('corte');
      // 4. o general comanda a guerra do rei
      Diplo.declareWar(A, C, 'teste'); const w = Diplo.D().wars.find(x => (x.a === A && x.b === C) || (x.a === C && x.b === A));
      ok(War.mySide(w) === A, 'a guerra do rei não é do general');
      UI.showCorte('cargo'); ok(UI.panel.querySelector('.cd-war'), 'a página do exército não mostra a guerra'); fits('exército');
      G.warCall = null; War.monthWar(w); ok(G.warCall && G.warCall.gen && G.warCall.side === A, 'o general não foi convocado');
      UI.showWarCouncil(); ok(!UI.panel.querySelector('[data-act="wassault"]') && UI.panel.querySelector('[data-act="cdDelegate"]'), 'o conselho do general (sem invadir castelo, com deixar o rei comandar)');
      const owner = G.civs[C].ruler; War.simulate(G.warCall);
      ok(!G.place && G.civs[C].ruler === owner && G.civs[A].ruler === 'npc', 'a batalha do general mudou o dono dos reinos');
      ok((RoyalCourt.C().log || []).length > 0, 'a batalha não entrou no registro do general');
      // 5. secretário: impostos e investimentos
      RoyalCourt.setOffice('treasurer'); const cA = G.civs[A]; cA.treasury = 5000; cA.stock.wood = 500; cA.stock.stone = 500;
      const t0 = cA.tax; Gab.setTax(0.04); ok(Math.abs(cA.tax - (t0 + 0.04)) < 0.011 || cA.tax === 0.3, 'o secretário não mudou o imposto');
      Personas.monthCiv(cA); ok(cA.tax === cA.secTax, 'o rei desfez o imposto do secretário');
      const lv = cA.invest.farms; Gab.invest('farms'); ok(cA.invest.farms === lv + 1, 'o secretário não investiu');
      UI.showCorte('cargo'); fits('tesouro');
      // 6. conselheiro: leis
      RoyalCourt.setOffice('advisor'); cA.laws = []; Math.random = () => 0; try { Gab.propose('escola', true); } finally { Math.random = rnd; }
      ok(cA.laws.includes('escola'), 'o conselheiro não aprovou a lei');
      UI.showCorte('cargo'); fits('leis');
      RoyalCourt.setOffice('diplomat'); UI.showCorte('cargo'); fits('diplomacia');
      // 7. trocar de cidadania tira cargo e título
      Cid.choose(B); ok(Cid.get() === B && !RoyalCourt.C() && Court.levelIn(A) < 0, 'trocar de cidadania não tirou o cargo e o título');
      // 8. os Jogos: palanques dos reis na arena e medalhas que honram o reino
      UI.close(); const S = Games.S(); S.year = 0; Games.start(); const h = S.host;
      Places.enterRoom(Arena.arenaOf(h));
      ok(Places.furn.filter(f => f.k === 'olybox').length === G.civs.filter(c => c && !c.dead && c.id !== h).length, 'a arena dos Jogos não tem um palanque por reino');
      const seated = G.ents.filter(e => e.placeNpc && e.npc && G.civs.some(c => c.id !== h && c.rulerId === e.npc.id)).length;
      ok(seated >= 4, `os reis não estão nos palanques (${seated})`);
      Places.exit(true);
      const kB = Cid.king(B), a0 = kB.aff; for (const ev of GAMES_ORDER) S.me[ev] = 300; G.day++; const rec = Games.resolve();
      ok(rec && rec.ev.archery[0].ci === B && kB.aff > a0, 'as medalhas não honraram o reino da cidadania');
      // 9. virar rei: a cidadania é o reino
      Game.becomeRuler(C, 'teste'); UI.close(); ok(Cid.get() === C, 'o rei não é cidadão do reino dele');
      return bad;
    });
    fails.push(...r.map(x => `${tag}: ${x}`));
  } finally { await close(); }
  fails.push(...errors.map(e => `${tag}: erro no jogo: ${e}`));
};
module.exports = async () => {
  const fails = [];
  await check(1366, 720, fails, 'pc');
  await check(844, 390, fails, 'celular');
  return fails;
};
