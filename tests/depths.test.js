// Masmorras com andares: a caverna tem andares com escada (vigiada por um guardião), as criaturas ficam mais fortes, o
// chefe mora no último andar e deixa um item lendário na primeira vez. Sair de qualquer andar volta ao mundo.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      const cave = World.caves.find(c => c.theme === 'troll') || World.caves[0], depth = Dungeon.depth(cave);
      const wx = P.x, wy = P.y, nStructs = World.structs.length;
      Dungeon.enter(cave);
      ok(G.dungeon && G.dungeon.floor === 1, 'não entrou no 1º andar');
      const down = World.structs.find(s => s.type === 'cave_down'); ok(down, 'o 1º andar não tem escada que desce');
      const guard = G.ents.find(e => e.floorGuard === 1); ok(guard && guard.nameTag, 'sem guardião no 1º andar');
      const hp1 = Math.max(...G.ents.filter(e => !e.dead && e.kind === 'skeleton' && !e.floorGuard).map(e => e.maxHp), 0);
      // a escada bloqueada pelo guardião
      Game.useStruct(down); ok(G.dungeon.floor === 1, 'desceu com o guardião vivo');
      if (guard) Game.kill(guard, P);
      Game.useStruct(down); ok(G.dungeon.floor === 2, 'não desceu ao 2º andar');
      ok(World.structs.some(s => s.type === 'cave_up'), 'o 2º andar não tem escada que sobe');
      const hp2 = Math.max(...G.ents.filter(e => !e.dead && e.kind === 'skeleton' && !e.floorGuard).map(e => e.maxHp), 0);
      if (hp1 && hp2) ok(hp2 > hp1, `as criaturas do 2º andar não são mais fortes (${hp1} → ${hp2})`);
      // subir e descer até o fundo
      Depths.up(); ok(G.dungeon.floor === 1, 'não subiu');
      for (let f = 1; f < depth; f++) { G.ents.filter(e => e.floorGuard).forEach(e => Game.kill(e, P)); Depths.down(); }
      ok(G.dungeon.floor === depth, 'não chegou ao último andar');
      const boss = G.ents.find(e => !e.dead && e.def && e.def.boss); ok(boss, 'o chefe não está no último andar');
      const L = LEGENDS[G.dungeon.theme];
      if (boss) Game.kill(boss, P);
      ok(L && Inv.count(L.k) === 1 && G.legends[G.dungeon.theme], 'o chefe não deixou o lendário');
      Dungeon.exit(false);
      ok(!G.dungeon && World.structs.length === nStructs, 'não voltou ao mundo direito');
      // segunda vez: sem outro lendário
      Dungeon.enter(cave); ok(G.dungeon.floor === 1, 'não entrou de novo'); Dungeon.exit(false);
      Inv.add(L.k, 1); Game.equip(L.k); ok(P.equip.weapon === L.k && Game.pDmg() >= L.dmg * 0.8, 'o lendário não vira arma');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
