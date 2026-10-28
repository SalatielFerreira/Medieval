// Novidades de outubro: vilas em quarteirões (estrada em volta de cada imóvel), fundar vila custa 100.000 para todos,
// aposta até 100.000, peças de leilão com forma própria no herói, Jogos dos Sete Reinos com sete provas e pódios,
// poderes dos títulos de nobreza, deixar o poder e as aplicações novas do banco.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 500000;
      // 1. vilas organizadas: cada imóvel visível num lote, sem vizinho encostado, com estrada em volta
      World.villages.forEach((v, vi) => {
        const occ = new Map(); for (const s of World.structs) if (s && !s.removed) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) occ.set(World.idx(i, j), s.id);
        const O = { get: k => occ.has(k) ? occ.get(k) : -1 };
        const M = TownPlan.members(vi).filter(s => !s.hidden);
        const bad = M.filter(s => !TownPlan.placedOk(s, vi, O));
        ok(bad.length <= 1, `${v.name}: ${bad.length} imóveis fora do traçado (${bad.slice(0, 3).map(s => s.type).join(', ')})`);
        let ring = 0, road = 0;
        for (const s of M.filter(q => !bad.includes(q))) for (let i = s.x - 1; i <= s.x + s.w; i++) for (const j of [s.y - 1, s.y + s.h]) { const t = World.tile(i, j); ring++; if (t === T.ROAD || t === T.BRIDGE) road++; }
        ok(!ring || road / ring > 0.9, `${v.name}: só ${Math.round(road / Math.max(1, ring) * 100)}% de estrada em volta dos imóveis`);
      });
      // 2. fundar vila: 100.000 para o herói, os reis e as famílias
      ok(FOUND_COST.gold === 100000, 'o preço de fundar vila não é 100.000');
      const f = Object.values(Families.F()).find(x => !x.player && !x.noble && x.seat !== null && x.seat !== 'castle');
      if (f) { f.founded = null; f.wealth = 5000; ok(!Families.canFound(f), 'família com 5.000 conseguiria fundar uma vila'); }
      // 3. aposta até 100.000
      ok(ARENA_MAX_BET === 100000, 'a aposta máxima não é 100.000');
      UI.showArena(0); ok(!!document.querySelector('.ar-chip[data-n="100000"]'), 'falta a ficha de 100.000 na arena');
      // 4. peças de leilão: a coroa de cristal é coroa (não elmo) e brilha
      Inv.add('crystal_crown', 1); P.equip.head = 'crystal_crown';
      const lk = playerLook(); ok(lk.regalia === 'crystal_crown' && !lk.helmet, 'a coroa de cristal não aparece como coroa');
      ok(UI.ii('crystal_crown').includes('ii-legend'), 'a peça de leilão não tem moldura na mochila');
      P.equip.head = null;
      // 5. nobreza: o Duque tem feudos, foro e muralha; deixar o governo e o título
      const ci = 1; Court.holdings()[ci] = 4; Court.syncPrincipal(); G.civs[ci].treasury = 99999;
      const g0 = P.gold; Nobility.monthTick(); ok(P.gold > g0, 'o feudo do Duque não rendeu');
      ok(Crime.commit(ci, 'teste', 100, null, null, true) === false, 'o Duque pagou multa no próprio reino');
      const vi = World.villages.findIndex(v => v && !v.free && v.civ === ci);
      Chiefdom.grant(vi, 'teste'); UI.sel.knav = 'crown'; UI.showKingdom();
      ok(!!document.querySelector('[data-act="nbLeaveV"]') && !!document.querySelector('[data-act="nbLeaveT"]'), 'faltam os botões de deixar o poder');
      UI.act('nbLeaveV', { v: vi }); ok(World.villages[vi].lord !== 'player', 'não deixou o governo da vila');
      UI.act('nbLeaveT', { c: ci }); ok(Court.levelIn(ci) < 0, 'não renunciou ao título');
      // 6. banco: bolsa, fundo, renda vitalícia e seguro
      Bolsa.buy('prata', 10); ok(Bolsa.X().own.prata === 10, 'não comprou ações');
      Bolsa.fundIn(1000); Bolsa.renda(0, 1000); Bolsa.X().insure = true; Bank.expedite('sal', 500);
      ok(Bank.B().exp.some(e => e.ins), 'a expedição saiu sem seguro');
      for (let k = 0; k < 3; k++) { G.day++; Bank.monthTick(); }
      ok(Bolsa.X().mkt.prata.hist.length >= 4, 'o preço das ações não mudou com os meses');
      UI.showBank(0, 'bolsa'); ok(!!document.querySelector('[data-op="buy"]'), 'a aba da Bolsa não abriu');
      UI.showBank(0, 'renda'); ok(!!document.querySelector('[data-op="renda"]'), 'a aba de fundos e renda não abriu');
      return out;
    });
    fails.push(...r);
    // 7. Jogos dos Sete Reinos: sete provas; terminando todas, a cerimônia dos pódios
    await page.evaluate(() => {
      const S = Games.S(); S.year = 0; Games.start(); Places.enterRoom(Arena.arenaOf(S.host));
      window._n = Object.keys(GAMES_EVENTS).length;
      for (const ev of Object.keys(GAMES_EVENTS)) if (!['brawl'].includes(ev)) S.me[ev] = 80;
      Games.play('brawl'); window._brawl = !!(G.duel && G.duel.brawl); G.duel.ent.dead = true; Arena.update();
    });
    await new Promise(res => setTimeout(res, 2600));
    const g = await page.evaluate(() => ({ n: _n, brawl: _brawl, on: Games.S().on, hist: Games.S().history.length, pod: !!document.querySelector('.podium'), steps: document.querySelectorAll('.pod-s').length }));
    if (g.n !== 7) fails.push(`os Jogos têm ${g.n} provas (eram para ser 7)`);
    if (!g.brawl) fails.push('a luta sem armas não começou');
    if (g.on || !g.hist) fails.push('terminadas todas as provas, os Jogos não se encerraram');
    if (!g.pod || g.steps < 21) fails.push('a janela dos pódios não mostrou os pódios das 7 provas');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
