// Prisão: cada castelo tem a sua; ir preso = a pena que o rei decide, numa cela trancada; dormir na palha passa os meses;
// cumprida a pena, sai pela porta. Jogo salvo no meio da pena volta para a cela. Arena e Cemitério saíram da lista.
'use strict';
const { open, wait } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {};
      ok(G.civs.every((c, ci) => Prison.of(ci)), 'há castelo sem prisão: ' + G.civs.map((c, ci) => Prison.of(ci) ? '' : ci).join(' '));
      const ci = G.civs.findIndex(c => c.ruler === 'npc'), s = Prison.of(ci);
      ok(Urban.movable(s), 'a prisão pode ser mudada de lugar ou demolida');
      // a pena: o jeito do rei pesa
      const k = G.people[G.civs[ci].rulerId], tr = k.trait;
      k.trait = 'rabugento'; const hard = Prison.sentence(ci, 300).months; k.trait = 'gentil'; const soft = Prison.sentence(ci, 300).months; k.trait = tr;
      ok(hard > soft, `o jeito do rei não muda a pena (${hard} e ${soft})`);
      // pego: vai para a cela
      Crime.W()[ci] = { bounty: 300, crimes: ['roubo'], resist: false };
      Crime.prison(ci);
      const J = Prison.cur();
      ok(J && J.until > G.day && G.place && G.place.type === 'prison', 'não foi para a cela');
      ok(!Crime.wanted(ci), 'continua procurado depois de preso');
      // trancado
      const before = G.place; Places.exit(); ok(G.place === before, 'saiu da cela antes de cumprir a pena');
      const bed = Places.furn.find(f => f.act === 'jailbed'), food = Places.furn.find(f => f.act === 'jailfood');
      ok(bed && food, 'a cela não tem a palha e a tigela');
      ok(Places.furn.filter(f => f.k === 'bars').length === 6, 'faltam as grades das celas');
      // o herói não consegue sair da cela andando (grades e paredes)
      const pl = G.place, cell = (x, y) => World.blocked ? World.blocked(pl.fx0 + x, pl.fy0 + y) : World.solid[World.idx(pl.fx0 + x, pl.fy0 + y)];
      ok([4, 5, 6].every(y => cell(10, y)) && cell(12, 3) && cell(12, 7), 'a cela tem saída');
      P.hunger = 10; Places.use(food); ok(P.hunger >= 60, 'a ração não matou a fome');
      // dormir até cumprir
      let n = 0; while (Prison.jailed() && n < 20) { Places.use(bed); n++; }
      ok(!Prison.jailed() && !G.place && n === J.months, `não saiu depois de ${J.months} meses (dormiu ${n})`);
      ok(U.dist(P.x / TILE, P.y / TILE, s.x + s.w / 2, s.y + s.h) < 4, 'não saiu pela porta da prisão');
      // presos de verdade nas celas
      const pr = G.people.find(p => p.alive && p.age > 18 && p.home && p.home.type === 'village' && World.villages[p.home.idx] && World.villages[p.home.idx].civ === ci);
      pr.jail = G.day + 3; Places.enterRoom(s);
      ok(G.ents.some(e => e.placeNpc && e.npc === pr), 'o morador preso não está na cela');
      Places.exit(true);
      // a lista de construção não tem mais Arena e Cemitério
      Game.becomeRuler(0, 't'); UI.close(); UI.showBuild(); UI.close();
      const all = UI.buildCats.flatMap(c => c[3]); ok(!all.includes('c:arena') && !all.includes('c:cemetery'), 'Arena ou Cemitério ainda na lista');
      // jogo salvo no meio da pena
      Crime.W()[ci] = { bounty: 300, crimes: ['roubo'], resist: false }; Crime.prison(ci);
      window.__snap = JSON.parse(JSON.stringify(Game.snapshot())); // como no jogo salvo de verdade
      return bad;
    });
    fails.push(...r);
    if (process.env.SHOT) { await wait(1500); await page.screenshot({ path: process.env.SHOT + '/jail.png' }); }
    const back = await page.evaluate(async () => { Places.exit(true, true); G.urban.prison = null; await Game.load(G.slot || 1, null, window.__snap); return (Prison.jailed() && G.place && G.place.type === 'prison') ? true : JSON.stringify({ cur: Prison.cur(), has: !!(Prison.cur() && Prison.of(Prison.cur().ci)), place: G.place && G.place.type, state: G.state, snapPrison: window.__snap.urban && window.__snap.urban.prison }); }).catch(e => 'erro: ' + e.message);
    if (back !== true) fails.push('ao carregar no meio da pena não voltou para a cela: ' + back);
    if (process.env.SHOT) { await page.evaluate(() => { Prison.S().prison = null; Places.exit(true, true); const s = Prison.of(1); P.x = (s.x + 2) * TILE; P.y = (s.y + 5) * TILE; }); await wait(1500); await page.screenshot({ path: process.env.SHOT + '/prison.png' }); }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
