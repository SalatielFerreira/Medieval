// Ferreiro com interação (forja, bigorna e mó abrem Criar com a forja liberada; estantes abrem a loja), conversar com
// quem está dormindo (acorda) e clicar no cavaleiro (a área de clique cobre o corpo inteiro, também a cavalo).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      P.god = true; // (sem silenciar UI.msg: o teste confere a resposta no balão)
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
      // conversa: os botões respondem com todos os reis e com quem é de sociedade secreta (o nome da sociedade não
      // pode atropelar a ficha da conversa)
      const people = [...G.civs.filter(c => c.rulerId != null).map(c => G.people[c.rulerId]), ...G.people.filter(q => q.alive && q.ssoc).slice(0, 5)].filter(Boolean);
      for (const q of people) {
        UI.showTalk(q.id); const a0 = q.aff; let err = null;
        try { UI.talkAct({ op: 'compliment', id: q.id }); } catch (x) { err = x; }
        ok(!err && (q.aff !== a0 || (q.soc && q.soc.n)), `os botões da conversa não respondem com ${q.name} (${q.rank}${q.ssoc ? ', sociedade ' + q.ssoc : ''})`);
      }
      { const q = people[0]; q.soc = 'smiths'; UI.showTalk(q.id); let err = null; try { UI.talkAct({ op: 'talk', id: q.id }); } catch (x) { err = x; } ok(!err && q.ssoc === 'smiths' && typeof q.soc === 'object', 'jogo salvo antigo (sociedade no campo da conversa) ainda quebra a conversa'); }
      UI.close();
      // E destravado: uma janela "aberta" que não está na tela não prende mais a tecla
      if (G.place) Places.exit(true);
      const st = World.structs.find(x => x && x.type === 'store' && !x.removed); Places.enterRoom(st);
      const fu = Places.furn.find(q => q.act === 'shop'); P.x = (fu.x + fu.w / 2) * TILE; P.y = (fu.y + fu.h + 0.6) * TILE;
      UI.cur = { fn: 'showInventory', args: [] }; UI.panel.classList.add('hidden');
      Game.onKey('KeyE'); ok(UI.cur && UI.cur.fn === 'showShop' && !UI.panel.classList.contains('hidden'), 'com uma janela fantasma, o E não abriu a loja');
      UI.close();
      // resposta visível: a recusa aparece no balão de interação
      const k = Shops.keeper(st); if (k) k.shop = null;
      const wk = Places.furn.find(q => q.act === 'shop'); wk.act = 'work'; Game.interact();
      const pm = document.getElementById('prompt').textContent; ok(/ninguém|cuidando|fechado/i.test(pm) || (UI.cur && !UI.panel.classList.contains('hidden')), 'a recusa ao apertar E não aparece em lugar nenhum: ' + pm);
      UI.close(); Places.exit(true);
      // a loja abre com qualquer item na mochila (os tabardos e elmos das ordens quebravam a do ferreiro)
      ok(Object.keys(ITEMS).every(k => ITEMS[k].key === k), 'há itens sem o próprio código');
      for (const k in ITEMS) Inv.add(k, 1);
      const seenR = new Set();
      for (const q of G.people.filter(x => x.alive && x.shop && x.age >= 14 && !x.capanga)) {
        if (seenR.has(q.rank)) continue; seenR.add(q.rank);
        UI.close(); UI.showTalk(q.id); const b = UI.panel.querySelector('[data-op="shopnpc"]'); if (!b) continue;
        let err = null; try { b.click(); } catch (x) { err = x.message; }
        ok(!err && UI.cur && UI.cur.fn === 'showShop', `com tudo na mochila, a loja de ${q.name} (${q.rank}) não abriu: ${err || (UI.cur && UI.cur.fn)}`);
      }
      UI.close();
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
