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
      // 1b. a cidadania à vista (no alto da tela) e o que o cidadão constrói no reino dele
      UI.updateHud && UI.updateHud(); ok(Game.playerTitle().text.includes(CIV_DEFS[A].short), 'a cidadania não aparece embaixo do nome');
      { const vi = World.villages.findIndex(v => v && !v.free && v.civ === A && !v.ruin), v = World.villages[vi]; let spot = null;
        for (let r = 4; r < 14 && !spot; r++) for (let a = 0; a < 16 && !spot; a++) { const x = Math.round(v.x + Math.cos(a / 16 * 6.28) * r), y = Math.round(v.y + Math.sin(a / 16 * 6.28) * r); P.x = (x + 0.5) * TILE; P.y = (y + 3.5) * TILE;
          if (!Game.canBuild('chest', x, y) && !Game.canBuild('cabin', x, y)) spot = [x, y]; }
        ok(!!spot, 'o cidadão não consegue pôr casa nem baú no reino dele');
        if (spot) { ok(!Urban.foreignTown(spot[0], spot[1]) || !Urban.roadErr(spot[0], spot[1]) || Urban.roadErr(spot[0], spot[1]) !== `Só o governador da vila ou o rei pode mexer nas estradas de ${v.name}`, 'o cidadão não abre estrada na vila do reino dele');
          const ob = World.villages.find(x => x && !x.free && x.civ === B && !x.ruin); if (ob) { P.x = (ob.x + 6.5) * TILE; P.y = (ob.y + 3.5) * TILE; ok(Game.canBuild('cabin', ob.x + 6, ob.y) !== null, 'construiu casa num reino que não é o da cidadania'); } } }
      // 1c. onde construir: casa e empreendimento em qualquer reino; produção, fazenda e baús na terra livre e no reino da
      //     cidadania; cada imóvel num reino alheio paga taxa por mês; estradas dos outros, só governador e rei
      { const spot = (ci, k) => { for (let n = 0; n < 4000; n++) { const x = 8 + Math.floor(Math.random() * (WORLD_W - 16)), y = 8 + Math.floor(Math.random() * (WORLD_H - 16)); if (World.terr[World.idx(x, y)] !== ci || Urban.authority(x, y)) continue; P.x = (x + 0.5) * TILE; P.y = (y + 4.5) * TILE; if (!Game.canBuild(k, x, y)) return [x, y]; } return null; };
        UI.showBuild(); UI.close();
        const biz = Object.keys(BIZ_TYPES).find(k => BUILDINGS[k] && BUILDINGS[k].w <= 2 && BUILDINGS[k].h <= 2) || Object.keys(BIZ_TYPES)[0];
        const sB = spot(B, 'cabin'); ok(sB, 'não dá para pôr casa num reino que não é o da cidadania');
        if (sB) { P.x = (sB[0] + 0.5) * TILE; P.y = (sB[1] + 4.5) * TILE; ok(Game.canBuild('workbench', sB[0], sB[1]), 'pôs oficina de produção num reino que não é o da cidadania'); }
        ok(spot(B, biz), 'não dá para abrir empreendimento num reino que não é o da cidadania (sem licença)');
        ok(spot(A, 'workbench'), 'não dá para pôr oficina de produção no reino da cidadania');
        ok(spot(-1, 'workbench'), 'não dá para pôr oficina de produção na terra livre');
        if (sB) { const st = World.addStruct('cabin', sB[0], sB[1], BUILDINGS.cabin.w, BUILDINGS.cabin.h, 'player'); const bl = Taxes.mine().find(b => b.ci === B); ok(bl && bl.houses >= 1 && bl.n >= 1, 'a casa num reino alheio não paga taxa');
          const g0 = P.gold, t0 = G.civs[B].treasury; Taxes.monthTick(); ok(P.gold < g0 && G.civs[B].treasury > t0, 'a taxa do mês não foi paga ao reino'); st.removed = true; }
        // estradas: só as suas (sem ser governador nem rei)
        let rd = null; for (let i = 0; i < World.tiles.length && !rd; i += 7) { if (World.tiles[i] !== T.ROAD) continue; const x = i % WORLD_W, y = (i / WORLD_W) | 0; if (Urban.authority(x, y) || Urban.foreignTown(x, y) || Urban.E().mine[i] !== undefined) continue; rd = [x, y]; }
        if (rd) { P.x = (rd[0] + 0.5) * TILE; P.y = (rd[1] + 0.5) * TILE; ok(Urban.unroadErr(rd[0], rd[1]), 'tirou uma estrada que não é sua sem ser governador nem rei'); }
      }
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
