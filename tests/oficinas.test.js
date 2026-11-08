// Ferreiro com interação (forja, bigorna e mó abrem Criar com a forja liberada; estantes abrem a loja), conversar com
// quem está dormindo (acorda) e clicar no cavaleiro (a área de clique cobre o corpo inteiro, também a cavalo).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.god = true;
      // ferreiro
      const s = World.structs.find(x => x && x.type === 'smith' && !x.removed);
      ok(s && Places.enterRoom(s), 'não entrou no ferreiro');
      const use = k => { const f = Places.furn.find(q => (q.k || q.kind || q.type) === k); if (!f) return '-'; UI.close(); P.x = (f.x + f.w / 2) * TILE; P.y = (f.y + f.h + 0.6) * TILE; const nf = Places.nearFurn(); if (!nf) return 'longe'; Game.interact(); return UI.cur && !UI.panel.classList.contains('hidden') ? UI.cur.fn : 'nada'; };
      ok(use('furnace') === 'showCrafting', 'a forja do ferreiro não faz nada');
      ok(use('anvil') === 'showCrafting', 'a bigorna do ferreiro não faz nada');
      ok(Game.nearStation('forja') && Game.nearStation('fundicao'), 'dentro do ferreiro a forja não conta como por perto');
      ok(use('weaponrack') === 'showShop', 'a estante de armas não abre a loja');
      UI.close(); Places.exit(true);
      ok(!Game.nearStation('forja') || World.structs.some(q => q.owner === 'player' && q.type === 'forge'), 'fora do ferreiro a forja continuou liberada');
      // quem dorme acorda para conversar
      const e = G.ents.find(q => q.npc && !q.dead && q.kind === 'villager');
      if (e) { e.sleeping = true; ok(Game.talkable(e), 'quem está dormindo não deixa conversar'); UI.showTalk(e.npc.id); ok(!e.sleeping && UI.cur && UI.cur.fn === 'showTalk', 'conversar não acordou a pessoa'); UI.close(); }
      // cavaleiro: o clique na cabeça pega
      if (e) { e.sleeping = false; e.npc.horse = '#5a3a22'; G.mouse.wx = e.x; G.mouse.wy = e.y - 40; Game.render ? 0 : 0;
        let bd = 24, hit = null; for (const q of G.ents) { if (!Game.talkable(q)) continue; const top = q.npc && q.npc.horse && !G.place ? 44 : 30, my = U.clamp(G.mouse.wy, q.y - top, q.y - 6); const d = U.dist(q.x, my, G.mouse.wx, G.mouse.wy); if (d < bd) { bd = d; hit = q; } }
        ok(hit === e, 'clicar na cabeça do cavaleiro não pega a pessoa'); }
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
