// Assassinos e caçadores de recompensa são moradores de verdade (nome, família, personalidade), não "bandidos" do nada.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      const alive0 = G.people.length;
      // assassino: o mesmo caminho do jogo (a fila G.assassins e o spawn com a marca 'assassin')
      const sp = freeSpotNear(P.x + 200, P.y, 60);
      const e = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' });
      ok(e.kind === 'villager' && e.npc && e.npc.alive, 'o assassino não é uma pessoa');
      const p = e.npc;
      ok(p && p.name && p.surname && TRAITS[p.trait] && p.home, 'o assassino não tem nome, família ou personalidade');
      ok(p.hit && p.hit.kind === 'assassin' && /pago/.test(p.hit.why), 'o assassino não sabe quem pagou');
      ok(e.angry && e.target === P && canHit(e), 'o assassino não ataca você');
      ok(e.tag === 'assassin', 'o assassino perdeu a marca (os imóveis contam com ela)');
      ok(e.name === People.full(p), 'o nome do assassino não aparece');
      // matá-lo é legítima defesa: não é crime
      const before = JSON.stringify(Crime.W ? Crime.W() : {});
      Game.kill(e, P);
      ok(!p.alive, 'o assassino não morreu');
      ok(JSON.stringify(Crime.W ? Crime.W() : {}) === before, 'matar o assassino virou crime');
      // de novo, mas ele escapa: volta a tentar, e quando o serviço acaba volta para a vida dele
      const e2 = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' }); const p2 = e2.npc;
      e2.dead = true; G.spawned.delete(p2.id);
      const e3 = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' });
      ok(e3.npc === p2, 'quem escapou não voltou para terminar o serviço');
      e3.dead = true; G.spawned.delete(p2.id);
      G.assassins = 0; Hitmen.monthTick();
      ok(!p2.hit && !p2.hostile && p2.alive, 'o serviço acabou e o assassino não voltou para a vida dele');
      // caçador de recompensa (Fora da lei)
      Hitmen.mode = 'hunter'; const h = Game.spawn('bandit', sp.x, sp.y, { leash: 40 }); Hitmen.mode = null;
      ok(h.npc && h.npc.hit && h.npc.hit.kind === 'hunter', 'o caçador de recompensa não é uma pessoa');
      ok(G.people.length - alive0 <= 3, 'criou gente nova demais em vez de usar os moradores');
      // os bandidos comuns continuam bandidos (do bando deles, em bands.js), não assassinos
      const b = Game.spawn('bandit', sp.x, sp.y, { leash: 8 });
      ok(b.kind === 'bandit' && !(b.npc && b.npc.hit), 'um bandido comum virou assassino');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
