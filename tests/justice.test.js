// Justiça: conversar com bandidos (assalto encomendado, recrutar, tirar da vida do crime), prisões com celas de 4,
// reis da IA prendendo e abrindo vaga, e você rei: prender, condenar à morte e declarar procurado.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 20000;
      // bandido do acampamento: calmo, aceita conversa
      const camp = World.camps.find(c => !c.cleared), sp = freeSpotNear((camp.x + 1.5) * TILE, (camp.y + 2) * TILE, 3 * TILE);
      const e = Game.spawn('bandit', sp.x, sp.y, { camp, leash: 8 }), b = e.npc;
      ok(!b.hostile && Game.talkable(e), 'o bandido do acampamento não aceita conversa');
      const acts = []; Lifesim.acts(b, acts); const ops = acts.map(a => a[0]);
      ok(['jbHeist', 'jbRecruit', 'jbRedeem'].every(o => ops.includes(o)), 'faltam as ações do bandido na conversa');
      // assalto encomendado
      const f = Object.values(G.fams).filter(x => !x.player && Families.members(x).length).sort((a, c) => c.wealth - a.wealth)[0]; f.wealth = Math.max(f.wealth, 3000);
      b.aff = 30; const w0 = f.wealth, g0 = P.gold; Justice.heist(b, f.id);
      ok(P.gold < g0 && Justice.S().heists.length === 1, 'não encomendou o assalto');
      let tries = 0; while (f.wealth === w0 && tries++ < 20) { Justice.S().heists = [{ pid: b.id, fid: f.id, day: G.day - 1, band: b.band }]; Justice.heistTick(); }
      ok(f.wealth < w0, 'o assalto nunca deu certo');
      // tirar da vida do crime
      const e2 = Game.spawn('bandit', sp.x, sp.y, { camp, leash: 8 }), b2 = e2.npc; b2.aff = 40; b2.bandFrom = 0;
      UI.talkAct({ op: 'jbRedeem', id: b2.id }); ok(!b2.band && b2.home.type === 'village' && b2.rank !== 'bandit', 'o bandido não largou a vida do crime');
      // recrutar
      const e3 = Game.spawn('bandit', sp.x, sp.y, { camp, leash: 8 }), b3 = e3.npc; b3.aff = 30;
      UI.talkAct({ op: 'jbRecruit', id: b3.id }); ok(b3.capanga && !b3.band, 'o bandido não veio para o seu lado');
      // reis da IA: prender e abrir vaga (4 celas de 4)
      const ci = G.civs.find(c => !c.dead && c.ruler !== 'player').id;
      const folk = G.people.filter(p => p.alive && p.age >= 16 && !p.kin && !p.capanga && p.home.type === 'village').slice(0, 17);
      for (const p of folk.slice(0, 16)) Justice.arrest(p, ci, 'teste', 5, true);
      ok(Justice.jail(ci).length === 16 && Justice.full(ci), 'a prisão não guarda 16 (4 celas de 4)');
      Justice.arrest(folk[16], ci, 'teste', 5, true);
      ok(Justice.jail(ci).length === 16 && Justice.jailedIn(folk[16]) === ci, 'o rei da IA não abriu vaga quando lotou');
      // você rei: prender, condenar e procurado
      Game.becomeRuler(1, 't'); UI.close();
      const sub = G.people.find(p => p.alive && p.age >= 18 && !p.kin && !p.capanga && Justice.subject(p) === 1 && !G.civs.some(c => c.rulerId === p.id));
      ok(sub, 'nenhum súdito para testar');
      const ka = []; Lifesim.acts(sub, ka); ok(ka.some(a => a[0] === 'jbArrest') && ka.some(a => a[0] === 'jbKill') && ka.some(a => a[0] === 'jbWant'), 'faltam prender, condenar e procurado na conversa');
      UI.talkAct({ op: 'jbArrest', id: sub.id }); ok(Justice.jailedIn(sub) === 1 && sub.jail > G.day, 'não mandou prender');
      Reign.show('jus'); ok(html().includes('Prisão e justiça') && html().includes('Cela 1') && html().includes(People.full(sub)), 'a aba Prisão e justiça não mostra o preso');
      Justice.execute(sub, 1, true); ok(!sub.alive && Justice.jailedIn(sub) < 0, 'não condenou à morte');
      // procurado: pisou no reino, os guardas pegam
      const out = G.people.find(p => p.alive && p.age >= 18 && !p.kin && !p.capanga && Justice.civOf(p) >= 0 && Justice.civOf(p) !== 1 && p.home.type === 'village' && Justice.jailedIn(p) < 0 && !(p.jail > G.day));
      Justice.declare(out, 1); ok(Justice.wanted(out).includes(1), 'não declarou procurado');
      const v1 = World.villages.findIndex(v => v && !v.free && v.civ === 1); out.trip = { vi: v1, from: out.home.idx, since: G.day, until: G.day + 2 };
      for (let k = 0; k < 12 && Justice.jailedIn(out) < 0; k++) Justice.monthTick();
      ok(Justice.jailedIn(out) === 1, 'o procurado pisou no reino e não foi preso');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
