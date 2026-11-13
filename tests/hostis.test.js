// Quem ataca do nada: assassino só vem enquanto alguém paga (casa em guerra com a sua ou conspiração da corte recente);
// a paz com a casa cancela na hora os assassinos dela; e a etiqueta sobre a pessoa diz o motivo (assassino, caçador de
// recompensa, bandido ou rancor) em vez de só "HOSTIL".
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.banner = () => {}; P.god = true;
      // sem guerra e sem conspiração: a fila que sobrou acaba e quem já caçava desiste
      G.assassins = 4; G.courtHitUntil = -1;
      const sp = freeSpotNear(P.x + 200, P.y, 60), e = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' }), p = e.npc;
      ok(p && p.hit && p.hostile, 'o assassino de teste não foi contratado');
      Hitmen.monthTick();
      ok(G.assassins === 0, `sem ninguém pagando, a fila continuou (${G.assassins})`);
      ok(!p.hit && !p.hostile && !e.angry && e.target !== P, 'sem ninguém pagando, o assassino continuou atacando');
      // com uma casa em guerra: os assassinos dela vêm; a paz cancela na hora
      const f = Object.values(Families.F()).find(x => !x.player && Families.members(x).length >= 2);
      const pf = Families.ensurePlayer(); pf.enemies = [f.id]; f.warOn = { by: Families.members(f)[0].id, day: G.day }; G.assassins = 3;
      ok(Hitmen.paid(), 'com a casa em guerra, ninguém paga os assassinos');
      const e2 = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' }), p2 = e2.npc;
      ok(p2 && p2.hit && p2.hit.fam === f.id, 'o assassino não é pago pela casa em guerra');
      // a etiqueta diz o motivo
      const tagOf = q => { const c = document.createElement('canvas').getContext('2d'); let txt = ''; const ft = c.fillText; c.fillText = function (t, ...a) { txt += t + '|'; return ft.call(this, t, ...a); }; Game._lastTag = ''; Game.drawTag(c, q, 0, 0, 10, 1); return txt || Game._lastTag; };
      ok(/ASSASSINO/.test(tagOf(e2)), 'a etiqueta do assassino não diz ASSASSINO: ' + tagOf(e2));
      Court.endFeud(f);
      ok(G.assassins === 0 && !p2.hit && !p2.hostile && !e2.angry, 'a paz com a casa não cancelou os assassinos dela');
      // rancor: brigão com amizade -70 aparece como RANCOR
      const q = G.ents.find(x => x.npc && !x.dead && x.kind === 'villager' && x.npc !== p && x.npc !== p2);
      if (q) { q.npc.hostile = true; ok(/RANCOR/.test(tagOf(q)), 'quem ataca por rancor não aparece como RANCOR: ' + tagOf(q)); q.npc.hostile = false; }
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
