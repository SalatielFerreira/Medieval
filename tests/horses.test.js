// Haras e corridas: raças e qualidades, a velocidade do cavalo no jogo, comprar no Estábulo, a construção Haras (com
// interior: cruzar e correr só lá), nascer o potro, trocar de cavalo, corrida com prêmio; o haras volta ao carregar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 20000;
      Horses.buy('puro'); ok(P.horse && P.horse.breed === 'puro', 'não comprou o puro-sangue');
      P.mounted = true; const fast = Ride.speed(); P.horse.speed = 3; const slow = Ride.speed(); ok(fast > slow, 'a velocidade do cavalo não conta'); P.horse.speed = 9; P.mounted = false;
      Horses.buy('arabe'); ok(Horses.herd().length === 0, 'comprou para o haras sem estábulo');
      const px = Math.floor(P.x / TILE) + 4, py = Math.floor(P.y / TILE) + 4; World.addStruct('stable', px, py, BUILDINGS.stable.w, BUILDINGS.stable.h, 'player', { built: true });
      Horses.buy('arabe'); Horses.buy('percherao'); ok(Horses.herd().length === 2, 'o haras não recebeu os cavalos');
      // cruzar: só com a construção Haras
      const all = [P.horse, ...Horses.herd()]; all[0].sex = 'm'; all[1].sex = 'f'; Horses.breed(all[1].id, all[0].id);
      ok(!all[1].foal, 'cruzou sem ter um Haras');
      const hs = World.addStruct('haras', px - 9, py - 9, BUILDINGS.haras.w, BUILDINGS.haras.h, 'player', { built: true });
      ok(Places.enterRoom(hs) && G.place.type === 'haras', 'não entrou no Haras');
      const acts = Places.furn.filter(f => f.act).map(f => f.act);
      ok(['hsbreed', 'hsrace', 'hsbook'].every(a => acts.includes(a)), 'faltam a baia de cruzamento, a mesa do Grande Prêmio ou o livro no Haras');
      Places.use(Places.furn.find(f => f.act === 'hsbreed')); ok(UI.cur.fn === 'showHaras' && /As suas baias/.test(html()) && /Cruzamento/.test(html()), 'a baia de cruzamento não abriu o haras');
      Places.use(Places.furn.find(f => f.act === 'hsrace')); ok(UI.cur.fn === 'showHaras' && /Correr agora|Já correu/.test(html()), 'a mesa do Grande Prêmio não abriu a corrida');
      ok(!/Comprar —/.test(html()), 'ainda dá para comprar cavalo na janela do Haras');
      UI.close(); Places.exit(true, true);
      UI.showStable(World.structs.find(s => s.type === 'stable' && s.owner === 'player').id); ok(/Cavalos de raça/.test(html()) && html().includes('data-op="buy"'), 'o Estábulo não vende as raças');
      UI.sel.bcat = 'guarda'; UI.showBuild(); ok(UI.buildCats.find(c => c[0] === 'guarda')[3].includes('haras') && !UI.panel.querySelector('[data-act="bcat"][data-k="haras"]'), 'o Haras não está em Baús e estábulo (ou a janela antiga ainda existe)');
      UI.close();
      Horses.breed(all[1].id, all[0].id);
      ok(all[1].foal, 'a égua não ficou prenha'); G.day += 2; Horses.monthTick(); ok(Horses.herd().length === 3 && !all[1].foal, 'o potro não nasceu');
      const foal = Horses.herd()[2]; ok(!Horses.adult(foal), 'o potro já nasceu adulto'); Horses.ride(foal.id); ok(P.horse !== foal, 'montou num potro');
      Horses.ride(all[2].id); ok(P.horse === all[2] && Horses.herd().includes(all[0]), 'não trocou de cavalo');
      // corrida
      P.horse = all[0]; Horses.herd().splice(Horses.herd().indexOf(all[0]), 1); P.horse.speed = 10; P.horse.stamina = 10;
      const g0 = P.gold; Horses.race(); ok(Horses.S().hist.length === 1 && UI.cur && UI.cur.fn === 'horseRace', 'a corrida não aconteceu');
      ok(Horses.nextRace().ran, 'a corrida do mês não ficou marcada');
      return { bad, n: Horses.herd().length };
    });
    fails.push(...r.bad);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const k = await page.evaluate(() => [Horses.herd().length, P.horse && P.horse.speed]);
    if (k[0] !== r.n || !k[1]) fails.push('o haras não voltou ao carregar: ' + JSON.stringify(k));
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
