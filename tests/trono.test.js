// Sala do trono: a corte (os quatro cargos) fica junto ao trono; a família real e os soldados ficam mais afastados —
// no castelo de um rei da IA e no seu. O rei caído: quando o trono passa para alguém de fora da família (golpe ou você
// tomando o reino), a família e a corte dele saem do castelo; na sucessão normal ninguém sai.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const castle = ci => World.structs.find(s => s && !s.removed && s.type === 'castle' && s.owner === ci);
      const room = ci => { if (G.place) Places.exit(true); Places.enterRoom(castle(ci)); const T = G.place; const tx = (T.fx0 + 7.5 + 0.5) * TILE, ty = (T.fy0 + 1.3 + 0.85) * TILE; return e => U.dist(e.x, e.y, tx, ty) / TILE; };
      // 1. castelo de um rei da IA
      const ci = G.civs.find(c => c && !c.dead && c.ruler !== 'player' && c.rulerId != null && castle(c.id)).id, king = People.get(G.civs[ci].rulerId);
      const cons = People.create({ sex: king.sex === 'm' ? 'f' : 'm', age: 40, rank: 'consort', civ: ci, home: { type: 'castle', civ: ci } }); People.marry(king, cons);
      const heir = People.child(cons.sex === 'f' ? cons : king, cons.sex === 'f' ? king : cons, { rank: 'heir', home: { type: 'castle', civ: ci }, civ: ci }); heir.age = 15;
      Politics.circle(ci);
      const d = room(ci), ents = G.ents.filter(e => !e.dead && e.placeNpc);
      const court = ents.filter(e => e.npc && Politics.seatOf(e.npc)), fam = ents.filter(e => e.npc && (e.npc === cons || e.npc === heir)), guards = ents.filter(e => e.royalGuard || e.tag === 'room');
      ok(court.length === 4, 'a corte do rei não está toda na sala do trono: ' + court.length);
      const maxC = Math.max(...court.map(d)), minF = Math.min(...fam.map(d)), minG = Math.min(...guards.map(d));
      ok(fam.length === 2 && minF > maxC, `a família não está mais afastada que a corte (corte até ${maxC.toFixed(1)}, família a ${minF.toFixed(1)})`);
      ok(guards.length && minG > maxC, 'os soldados não estão mais afastados que a corte');
      Places.exit(true);
      // 2. o seu castelo: o conselho junto ao trono, os seus filhos mais afastados
      const mine = G.civs.find(c => c && !c.dead && c.id !== ci && castle(c.id)).id;
      Game.becomeRuler(mine, 'teste'); UI.close();
      Game.birth('Nina', 'f'); const nina = G.people.find(p => p.name === 'Nina' && p.kin); nina.age = 10; nina.rank = 'child';
      const tes = Court.pool(mine).find(p => !p.kin); Court.appoint(mine, 'treasurer', tes);
      const d2 = room(mine), e2 = G.ents.filter(e => !e.dead && e.placeNpc && e.npc), et = e2.find(e => e.npc === tes), en = e2.find(e => e.npc === nina);
      ok(et && en && d2(en) > d2(et), 'no seu castelo, o conselho não fica junto ao trono e os filhos mais afastados');
      Places.exit(true);
      // 3. golpe: o rei caído perde a família e a corte do castelo
      const circle0 = Politics.circlePeople(ci).map(x => x.p).filter(p => p.home.type === 'castle');
      const outsider = People.create({ sex: 'm', age: 35, rank: 'knight', civ: ci, home: { type: 'village', idx: World.villages.findIndex(v => v && v.civ === ci) } });
      People.die(king, 'golpe'); Succession.seat(G.civs[ci], outsider, 'ruler');
      ok(cons.home.type !== 'castle' && heir.home.type !== 'castle' && cons.rank !== 'consort' && heir.rank !== 'heir', 'a família do rei caído continuou no castelo');
      ok(circle0.every(p => !Politics.seatOf(p) && p.home.type !== 'castle'), 'a corte do rei caído continuou no castelo');
      // 4. sucessão normal: a família fica
      const c3 = G.civs.find(c => c && !c.dead && c.ruler !== 'player' && c.rulerId != null && c.id !== ci && c.id !== mine), k3 = People.get(c3.rulerId);
      const q3 = People.create({ sex: k3.sex === 'm' ? 'f' : 'm', age: 40, rank: 'consort', civ: c3.id, home: { type: 'castle', civ: c3.id } }); People.marry(k3, q3);
      const h3 = People.child(q3.sex === 'f' ? q3 : k3, q3.sex === 'f' ? k3 : q3, { rank: 'heir', home: { type: 'castle', civ: c3.id }, civ: c3.id }); h3.age = 20;
      People.die(k3, 'velhice'); Succession.seat(c3, h3, 'ruler');
      ok(q3.home.type === 'castle', 'na sucessão normal a rainha-mãe foi expulsa');
      // 5. você toma um reino: a família do rei de antes sai
      const c4 = G.civs.find(c => c && !c.dead && c.ruler !== 'player' && c.rulerId != null && c !== c3 && c.id !== ci), k4 = People.get(c4.rulerId);
      const q4 = People.create({ sex: k4.sex === 'm' ? 'f' : 'm', age: 40, rank: 'consort', civ: c4.id, home: { type: 'castle', civ: c4.id } }); People.marry(k4, q4);
      Game.becomeRuler(c4.id, 'teste'); UI.close();
      ok(q4.home.type !== 'castle' && q4.rank !== 'consort', 'quando você tomou o reino, a família do rei de antes ficou no castelo');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
