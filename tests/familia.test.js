// Ninguém (gente ou bicho) mata quem tem menos de 18 anos; os filhos de 16 anos ou mais podem ser armados, equipados
// e ir com você.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.god = true;
      // uma criança de 12 anos e um lobo do lado
      const kid = People.create({ rank: 'peasant', civ: 0, home: { type: 'village', idx: 0 }, age: 12 });
      const ke = Game.spawn('villager', P.x + 60, P.y, { npc: kid, civ: 0 });
      const wolf = Game.spawn('wolf', P.x + 80, P.y, {});
      ok(!hostile(wolf, ke), 'o lobo vê a criança como alvo');
      const hp0 = ke.hp; Game.damage(ke, 50, wolf); ok(ke.hp === hp0 && !ke.dead, 'o lobo feriu a criança');
      const ban = Game.spawn('bandit', P.x + 90, P.y, {}); Game.damage(ke, 500, ban); ok(!ke.dead, 'o bandido matou a criança');
      // um adulto apanha normalmente
      const ad = People.create({ rank: 'peasant', civ: 0, home: { type: 'village', idx: 0 }, age: 30 });
      const ae = Game.spawn('villager', P.x + 60, P.y + 30, { npc: ad, civ: 0 }); const h1 = ae.hp; Game.damage(ae, 10, wolf); ok(ae.hp < h1, 'o adulto não levou dano');
      // 17 anos ainda é protegido; 18 não
      kid.age = 17; ok(!hostile(wolf, ke), 'aos 17 virou alvo'); kid.age = 18; ok(hostile(wolf, ke) || fac(ke) === fac(wolf), 'aos 18 continua protegido');
      wolf.dead = ban.dead = ke.dead = ae.dead = true;
      // filho de 16 anos: armar e levar junto
      const son = People.create({ rank: 'peasant', civ: 0, home: { type: 'player' }, age: 16, sex: 'm' }); son.kin = 'child'; son.equip = son.equip || {};
      const acts = []; Lifesim.acts(son, acts);
      ok(acts.some(a => a[0] === 'equipc') && acts.some(a => a[0] === 'kinjoin'), 'o filho de 16 anos não tem "Armar e equipar" e "Vir comigo"');
      const kid2 = People.create({ rank: 'child', civ: 0, home: { type: 'player' }, age: 12 }); kid2.kin = 'child'; const a2 = []; Lifesim.acts(kid2, a2); ok(!a2.some(a => a[0] === 'kinjoin' || a[0] === 'equipc'), 'o filho de 12 anos pode ser armado');
      Inv.add('iron_sword', 1); const sw = Object.keys(ITEMS).find(k => ITEMS[k].slot === 'weapon' && Inv.count(k) > 0);
      UI.talkAct({ op: 'equipc', id: son.id }); ok(UI.cur && UI.cur.fn === 'showEquipC', 'a janela de equipar não abriu');
      if (sw) { UI.talkAct({ op: 'ceq', id: son.id, k: sw }); ok(son.equip.weapon === sw, 'a arma não foi entregue ao filho'); }
      UI.talkAct({ op: 'kinjoin', id: son.id }); ok(son.capanga && Game.allies().some(e => e.npc === son), 'o filho não veio junto');
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
