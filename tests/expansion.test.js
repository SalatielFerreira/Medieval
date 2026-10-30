// Expansão: o dobro de construções (15/20/20/45/20/10/10/10/15 por categoria) e de itens; todo item tem ícone, origem
// e uso; todas as construções novas são erguidas, desenhadas de dia e de noite, usadas e produzem; as oficinas novas
// fazem as suas receitas; pergaminhos e cajados mágicos funcionam.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      UI.showBuild(); UI.close();
      const cats = Object.fromEntries(UI.buildCats.map(c => [c[0], c[3].length]));
      // Defesa, Praça e Cultura foram para as Obras nas vilas e saíram da Infraestrutura o Atracadouro, o Guindaste e o Moinho de Vento
      const want = { moradia: 9, producao: 20, fazenda: 20, negocios: 45, guarda: 7, infra: 4 }; // infraestrutura sem o Posto de Muda, o Posto de Pedágio e sem subir o nível das estradas
      ok(!UI.buildCats.flatMap(c => c[3]).some(k => BR.OUT.includes(k) || BR.INFRA_OUT.includes(k)), 'construção retirada ainda aparece no menu');
      ok(!cats.praca && !cats.cultura, 'Praça e Cultura ainda aparecem sem ser governador ou rei');
      for (const k in want) ok(cats[k] === want[k], `${k}: ${cats[k]} construções (meta ${want[k]})`);
      ok(Object.keys(ITEMS).length >= 440, 'itens: ' + Object.keys(ITEMS).length);
      const noArt = Object.keys(ITEMS).filter(k => !itemArt(k)); ok(!noArt.length, 'itens sem ícone: ' + noArt.join(', '));
      const noBI = UI.buildCats.flatMap(c => c[3]).filter(k => BUILDINGS[k] && !buildArt(k)); ok(!noBI.length, 'construções sem ícone: ' + noBI.join(', '));
      ok(RECIPES.every(r => ITEMS[r.out] && (!r.station || STATIONS[r.station]) && Object.keys(r.cost).every(k => ITEMS[k] || ITEM_GROUPS[k])), 'receita com item ou estação inexistente');
      const made = new Set(RECIPES.map(r => r.out)), sold = new Set(Object.values(SHOPS).flatMap(s => s.sells || []));
      const src = new Set([...Object.values(NODE_EXTRA).flatMap(o => Object.keys(o)), ...Object.values(CREATURES).flatMap(c => Object.keys(c.drops || {})),
        ...EXP_BUILDINGS.flatMap(r => Object.keys(r[8].farm || {}).concat(Object.keys((r[8].biz && r[8].biz.out) || {}))), ...Object.values(CROPS).map(c => c.item), 'seashell', 'seaweed', 'mussels']);
      const orphan = EXP_ITEMS.map(r => r[0]).filter(k => !made.has(k) && !sold.has(k) && !src.has(k)); ok(!orphan.length, 'itens sem origem: ' + orphan.join(', '));
      const used = new Set(RECIPES.flatMap(r => Object.keys(r.cost)).concat(Object.values(BUILDINGS).flatMap(b => Object.keys(b.cost))));
      const dead = EXP_ITEMS.filter(r => ['Recursos', 'Materiais'].includes(r[3])).map(r => r[0]).filter(k => !used.has(k)); ok(!dead.length, 'matérias-primas sem uso: ' + dead.join(', '));
      // erguer e usar tudo
      P.god = true; P.gold = 99999; for (const k in ITEMS) P.inv[k] = 50;
      const free = (x, y, w, h) => World.areaOk(x, y, w, h) && World.areaFree(x, y, w, h) && [...Array(w)].every((_, i) => [...Array(h)].every((__, j) => !World.obj[World.idx(x + i, y + j)]));
      const v0 = World.villages[0], placed = [];
      for (const row of EXP_BUILDINGS) {
        const k = row[0], b = BUILDINGS[k]; let spot = null;
        for (let rr = 0; rr < 140 && !spot; rr++) for (let a = 0; a < 48 && !spot; a++) { const x = Math.round(v0.x + Math.cos(a / 48 * 6.28) * (14 + rr)), y = Math.round(v0.y + Math.sin(a / 48 * 6.28) * (14 + rr)); if (free(x - 1, y - 1, b.w + 2, b.h + 2)) spot = { x, y }; }
        if (!spot) { bad.push('sem lugar para ' + k); continue; }
        placed.push(World.addStruct(k, spot.x, spot.y, b.w, b.h, 'player', { built: true })); Content.onBuild(k);
      }
      const ctx = document.createElement('canvas').getContext('2d');
      for (const night of [0, 0.6]) { G.darkness = night; for (const s of placed) try { World.drawStruct(ctx, s, 10, 10, 2.1); } catch (e) { bad.push('desenho de ' + s.type + ': ' + e.message); } }
      G.darkness = 0;
      for (const s of placed) { P.x = (s.x + s.w / 2) * TILE; P.y = (s.y + s.h + 0.5) * TILE; try { UI.close(); Game.useStruct(s); Content.label(s); } catch (e) { bad.push('usar ' + s.type + ': ' + e.message); } }
      UI.close();
      for (let k = 0; k < 2; k++) Game.onNewDay();
      const idle = placed.filter(s => expFn(s.type).farm && !(expFn(s.type).season && Season.winter()) && (!s.goods || !Object.keys(s.goods).length));
      ok(!idle.length, 'não produziram: ' + idle.map(s => s.type).join(', '));
      ok(VillageEcon.parts(0).some(p => p[0] === '🏛️'), 'as obras não contam no poder da vila');
      for (const st of ['serraria', 'fundicao', 'vidraria', 'ourives', 'tinturaria', 'lagar', 'moenda', 'arcano', 'armeiro']) {
        const s = placed.find(x => STATIONS[st].types.includes(x.type)); P.x = (s.x + 1) * TILE; P.y = (s.y + s.h + 0.5) * TILE;
        const ri = RECIPES.findIndex(r => r.station === st), out = RECIPES[ri].out, n0 = Inv.count(out); Game.craft(ri, 1);
        ok(Inv.count(out) > n0, 'a estação ' + st + ' não fez ' + out);
      }
      const w = Game.spawn('wolf', P.x + 40, P.y, { leash: 2 }); w.target = P; Expansion.use('scroll_fireball'); ok(w.dead || w.hp < w.maxHp, 'a bola de fogo não feriu');
      P.equip.weapon = 'fire_staff'; P.stamina = 100; Ranged.shoot(0); ok(P.stamina < 100, 'o cajado não gastou energia');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
