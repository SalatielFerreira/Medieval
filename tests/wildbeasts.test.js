// Feras errantes: aparecem, andam até as vilas e atacam, os reinos põem ouro na recompensa, perto do herói existem de
// verdade, e abater paga a recompensa com troféu.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      for (const k of Object.keys(BEAST_KINDS)) { const b = Beasts.spawn(k); ok(b, 'não nasceu: ' + k); }
      const b = Beasts.L()[0]; ok(b && b.target >= 0, 'a fera não escolheu uma vila');
      // anda até a vila e ataca
      const v = World.villages[b.target]; b.x = v.x + 1; b.y = v.y; const p0 = v.prosper = 30;
      for (const c of G.civs) c.treasury = 3000;
      Beasts.monthTick(); ok(v.prosper < p0 && b.attacks === 1, 'a fera não atacou a vila');
      ok(v.free || Beasts.bounty(b) > 0 || G.civs[v.civ].ruler === 'player', 'o reino não pôs ouro na recompensa');
      // perto do herói existe de verdade
      P.x = (b.x + 0.5) * TILE; P.y = (b.y + 3) * TILE; Beasts.t = 0; Beasts.update(1);
      const e = G.ents.find(x => x.beast === b.id && !x.dead); ok(e, 'a fera não apareceu perto do herói');
      // desenho
      const ctx = document.createElement('canvas').getContext('2d'); for (const x of G.ents.filter(x => x.beast)) x.draw(ctx, 0, 0);
      // abater
      b.bounty = { 1: 500 }; const g0 = P.gold, trophy = BEAST_KINDS[b.kind].trophy[0], t0 = Inv.count(trophy);
      if (e) Game.kill(e, P);
      ok(P.gold >= g0 + 500 && Inv.count(trophy) > t0 && !Beasts.L().includes(b), 'abater a fera não pagou a recompensa');
      Game.drawMinimap(ctx, 1000);
      return { bad, n: Beasts.L().length };
    });
    fails.push(...r.bad);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const n = await page.evaluate(() => (G.beasts || []).length);
    if (n !== r.n) fails.push(`as feras não voltaram ao carregar (${r.n} → ${n})`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
