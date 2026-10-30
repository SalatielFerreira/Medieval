// Bandidos de verdade: os bandos dos acampamentos, das emboscadas e o exército anarquista são pessoas (nome, família,
// personalidade); quem escapa volta; matar um bandido não é crime; o ladrão do caixa tem nome e fica com o dinheiro.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      const camp = World.camps.find(c => !c.cleared);
      const sp = freeSpotNear((camp.x + 1.5) * TILE, (camp.y + 2) * TILE, 3 * TILE);
      const e = Game.spawn('bandit', sp.x, sp.y, { camp, leash: 8 });
      ok(e.kind === 'bandit' && e.camp === camp, 'o bandido do acampamento deixou de ser bandido');
      const p = e.npc;
      ok(p && p.alive && p.name && p.surname && TRAITS[p.trait] && p.band === 'camp' + World.camps.indexOf(camp), 'o bandido do acampamento não é uma pessoa do bando');
      ok(p.rank === 'bandit' && e.name === People.full(p), 'o bandido não tem o nome dele');
      ok(hostile(e, P), 'o bandido não ataca');
      // quem escapa volta no próximo ataque
      e.dead = true; G.spawned.delete(p.id);
      const e2 = Game.spawn('bandit', sp.x, sp.y, { camp, leash: 8 });
      ok(e2.npc === p, 'o bandido que escapou não voltou');
      // matar é legítima defesa
      const before = JSON.stringify(Crime.W());
      Game.kill(e2, P); ok(!p.alive, 'o bandido não morreu');
      ok(JSON.stringify(Crime.W()) === before, 'matar um bandido virou crime');
      const e3 = Game.spawn('bandit', sp.x, sp.y, { camp, leash: 8 }); ok(e3.npc && e3.npc !== p && e3.npc.alive, 'o bando não recrutou alguém novo');
      // emboscada a caravana e exército anarquista
      const a = Game.spawn('bandit', sp.x, sp.y, { leash: 18, tag: 'amb7' }); ok(a.npc && a.npc.band === 'amb', 'quem embosca caravanas não é uma pessoa');
      const n = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'anarch' }); ok(n.npc && /^anarch/.test(n.npc.band), 'o exército anarquista não é de pessoas');
      // os assassinos continuam com hitmen.js
      const h = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' }); ok(h.kind === 'villager' && h.npc && h.npc.hit, 'o assassino virou bandido de bando');
      // o ladrão do caixa
      const s = { type: 'biz_shop', x: Math.floor(P.x / TILE), y: Math.floor(P.y / TILE), w: 2, h: 2 };
      const who = Bands.rob(s, 50);
      ok(typeof who === 'string' && who.length > 3, 'o ladrão não tem nome');
      ok(G.people.some(q => q.alive && (q.stole || 0) >= 50), 'o dinheiro roubado não ficou com o ladrão');
      // os forasteiros de um bando não criam uma família nova cada um
      const f0 = Object.keys(G.fams || {}).length; for (let i = 0; i < 4; i++) Bands.stranger('teste'); ok(Object.keys(G.fams || {}).length - f0 <= 1, 'cada bandido de fora criou uma família');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
