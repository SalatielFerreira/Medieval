// Campo de batalha: escolher um lado leva ao campo, os exércitos têm todos os tipos de tropa, e a luta continua
// enquanto o herói estiver de pé (mesmo com o exército dele inteiro caído).
'use strict';
const { open, wait } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      P.maxHp = P.hp = 99999; G.civs[1].garrison = 30; G.civs[2].garrison = 30;
      const bt = Battles.create(1, 2); P.x = bt.x * TILE; P.y = (bt.y + 3) * TILE; Battles.update(); UI.close(); Battles.join(bt, 1);
      const B = G.place; if (!B || B.kind !== 'battle') return { err: 'não foi para o campo de batalha' };
      const kinds = new Set(G.ents.filter(e => !e.dead && e.battle === B.id && e.wside === B.side).map(e => e.mounted ? 'cav' : e.unit || (e.archer ? 'arc' : e.kind === 'lord' ? 'rei' : e.faction === 'engine' ? 'cat' : 'esp')));
      for (const e of G.ents) if (!e.dead && e.battle === B.id && e.wside === B.side) Game.kill(e, null);
      return { kinds: [...kinds] };
    });
    if (r.err) fails.push(r.err);
    else {
      for (const k of ['shield', 'spear', 'cav', 'arc', 'rei']) if (!r.kinds.includes(k)) fails.push(`exército sem ${k}`);
      await wait(2500);
      const still = await page.evaluate(() => !!(G.place && G.place.kind === 'battle' && !G.place.done));
      if (!still) fails.push('a batalha acabou com o herói ainda de pé');
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
