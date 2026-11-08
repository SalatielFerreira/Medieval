// Cavalo para o capanga (Equipar → Cavalo): comprar ou dar um do haras, montado anda mais rápido e aguenta mais,
// tirar devolve ao haras; e conversar com reis e rainhas mesmo em guerra.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.gold = 5000;
      const p = Game.newMercenary(-1), st0 = People.capangaStats(p);
      UI.showEquipC(p.id); ok(UI.panel.querySelector('[data-act="capHorseBuy"]'), 'a janela Equipar não tem o quadro do cavalo');
      const g0 = P.gold; UI.act('capHorseBuy', { id: p.id, k: 'andaluz' });
      ok(p.horse && p.horseData && P.gold === g0 - HORSE_BREEDS.andaluz.price, 'não comprou o cavalo do capanga');
      const st1 = People.capangaStats(p); ok(st1.hp > st0.hp && st1.dmg > st0.dmg, 'montado, o capanga não ficou mais forte');
      ok(UI.panel.querySelector('[data-act="capHorseOff"]'), 'falta o botão de tirar o cavalo');
      // no jogo: desenhado montado e mais rápido
      const e = G.spawned.get(p.id); ok(e, 'o capanga não está no mundo');
      if (e) { const c = document.createElement('canvas').getContext('2d'); e.draw ? e.draw(c, 100, 100) : 0; ok(e._hs && e._hsMul > 1.2, 'o capanga montado não ficou mais rápido'); }
      // tirar: volta ao haras e o capanga pode receber de volta
      const n0 = Horses.herd().length; UI.act('capHorseOff', { id: p.id }); ok(!p.horse && Horses.herd().length === n0 + 1, 'o cavalo não voltou para o haras');
      const h = Horses.herd()[Horses.herd().length - 1]; UI.showEquipC(p.id); UI.act('capHorse', { id: p.id, h: h.id }); ok(p.horse && !Horses.herd().includes(h), 'não deu o cavalo do haras');
      // curar: comida da mochila devolve vida ao capanga
      { const e2 = G.spawned.get(p.id); e2.hp = 20; Inv.add('bread', 2); const k = Object.keys(ITEMS).find(x => ITEMS[x].heal > 0 && Inv.count(x)) || (Inv.add('apple', 1), 'apple');
        const it = Object.keys(P.inv).find(x => P.inv[x] > 0 && ITEMS[x] && ITEMS[x].heal > 0); UI.showEquipC(p.id);
        ok(UI.panel.querySelector('[data-act="capHeal"]'), 'falta o botão de curar o capanga');
        const n0 = Inv.count(it); UI.act('capHeal', { id: p.id, k: it }); ok(e2.hp > 20 && Inv.count(it) === n0 - 1, 'curar não devolveu vida ao capanga'); }
      // reis: conversa mesmo em guerra
      const ci = 1, c = G.civs[ci], castle = World.structs.find(s => s && s.type === 'castle' && s.owner === ci);
      c.atWar = true; Places.enterRoom(castle); const k = G.ents.find(q => q.npc && q.npc.id === c.rulerId);
      ok(k && Game.talkable(k), 'em guerra, não dá para conversar com o rei'); if (k) { UI.showTalk(k.npc.id); ok(UI.cur && UI.cur.fn === 'showTalk', 'a conversa com o rei não abriu'); }
      c.atWar = false; Places.exit(true); UI.close();
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
