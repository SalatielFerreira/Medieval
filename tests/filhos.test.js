// A vida dos seus filhos depois dos 18 anos: saem de casa para uma vila (ofício da profissão, mesma família), constroem
// a própria casa, casam como os outros moradores, têm filhos (os seus netos, na sua família), vão para a corte do rei,
// tramam golpes (sozinhos ou mandados por você) e podem virar reis; golpe fracassado leva à prisão ou à morte.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, r0 = Math.random, luck = v => { Math.random = () => v; };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      try {
        Families.ensurePlayer();
        Game.birth('Ana', 'f'); Game.birth('Beto', 'm');
        const kids = G.people.filter(p => p.kin === 'child'), ana = kids.find(p => p.name === 'Ana'), beto = kids.find(p => p.name === 'Beto');
        ana.age = 17; beto.age = 18; beto.prof = 'knight'; ana.rank = beto.rank = 'peasant';
        // 1. aos 18 sai de casa (a de 17 fica)
        Grown.monthTick();
        ok(beto.grown && beto.home.type === 'village' && !ana.grown && ana.home.type === 'player', 'aos 18 o filho não saiu de casa (ou a de 17 saiu)');
        ok(beto.rank === 'knight' && People.title(beto) === 'Cavaleiro', 'a profissão não virou o ofício: ' + beto.rank + ' / ' + People.title(beto));
        ok(beto.fam === G.playerFam && /filho/i.test(People.relation(beto).text), 'saiu da família ou deixou de ser seu filho');
        ok(Homes.household(beto) === beto.id, 'não tem a própria casa (continua na sua)');
        ana.age = 18; Grown.monthTick(); ok(ana.grown && ana.home.type === 'village', 'a filha não saiu de casa aos 18');
        // 2. constrói a própria casa
        for (let k = 0; k < 80 && !Homes.houseOf(beto) && !Homes.buildOf(beto); k++) Homes.dayTick(true);
        ok(Homes.houseOf(beto) || Homes.buildOf(beto), 'o filho não começou a construir a casa dele');
        // 3. casa como os moradores
        const vi = beto.home.idx, w = People.create({ name: 'Clara', sex: 'f', age: 20, rank: 'peasant', civ: beto.civ, home: { type: 'village', idx: vi } });
        w.spouse = null; w.dating = false;
        const held = G.people.filter(q => q !== w && q !== beto && q.alive && q.spouse === null && !q.dating); held.forEach(q => { q.dating = true; });
        luck(0.1); Families.yearTick(); Math.random = r0;
        held.forEach(q => { q.dating = false; });
        ok(beto.spouse === w.id && w.fam === G.playerFam, 'o filho não se casou com a moradora (ou ela não entrou na família)');
        // 4. os netos continuam a família
        const neto = People.child(w, beto, {}); ok(Grown.grand(neto) && /neto|neta/i.test(People.relation(neto).text) && neto.fam === G.playerFam, 'o neto não é da sua família');
        // 5. a corte: um reino com rei para o resto do teste
        const civ = G.civs.find(c => c && !c.dead && c.ruler !== 'player' && c.rulerId != null && World.villages.some(v => v && !v.free && !v.ruin && v.civ === c.id));
        const v2 = World.villages.findIndex(v => v && !v.free && !v.ruin && v.civ === civ.id);
        beto.home = { type: 'village', idx: v2 }; beto.civ = civ.id; beto.age = 25; w.home = { type: 'village', idx: v2 };
        luck(0); Grown.courtTick(beto); Math.random = r0;
        ok(Politics.seatOf(beto) && !/undefined/.test(Grown.role(beto) + Grown.tags(beto).join()), 'o filho não foi chamado para a corte do rei');
        // 6. golpe mandado por você: financiar e tomar o trono
        UI.talkAct({ op: 'gcPlot', id: beto.id }); ok(beto.coup && beto.coup.by === 'player', 'não deu para mandar tramar o golpe');
        const c0 = Grown.chance(beto); UI.talkAct({ op: 'gcFund', id: beto.id }); ok(beto.coup.fund === 1000 && Grown.chance(beto) >= c0, 'financiar não aumentou a chance');
        G.day = beto.coup.ripe; luck(0); Grown.ambitionTick(beto); Math.random = r0;
        ok(civ.rulerId === beto.id && civ.ruler === 'npc' && beto.rank === 'ruler' && w.rank === 'consort', 'o golpe não pôs o filho no trono');
        ok(/Rei de/.test(Grown.role(beto)), 'a família não mostra que ele é rei: ' + Grown.role(beto));
        // 7. a filha tram sozinha (ambição) e o golpe fracassa
        const civ2 = G.civs.find(c => c && !c.dead && c.ruler !== 'player' && c.rulerId != null && c !== civ && World.villages.some(v => v && !v.free && !v.ruin && v.civ === c.id));
        const v3 = World.villages.findIndex(v => v && !v.free && !v.ruin && v.civ === civ2.id);
        ana.home = { type: 'village', idx: v3 }; ana.civ = civ2.id; ana.age = 24; ana.ambition = 3;
        luck(0); Grown.ambitionTick(ana); Math.random = r0; ok(ana.coup && ana.coup.by === 'self', 'a filha ambiciosa não tramou sozinha');
        const king2 = civ2.rulerId; G.day = ana.coup.ripe; luck(0.99); Grown.ambitionTick(ana); Math.random = r0;
        ok(civ2.rulerId === king2 && (!ana.alive || ana.jail > G.day), 'o golpe fracassado não teve consequência');
        // 8. a página da família mostra a vida de cada um
        UI.sel.knav = 'family'; UI.showKingdom(); ok(/Rei de/.test(UI.panel.innerHTML), 'a família não mostra o que os filhos fazem');
        // 9. a árvore mostra todos os filhos e todos os netos, sem "+N"
        for (let i = 0; i < 9; i++) Game.birth('Filho' + i, i % 2 ? 'f' : 'm');
        for (let i = 0; i < 10; i++) People.child(w, beto, {});
        UI.sel.knav = 'family'; UI.showKingdom();
        const nk = G.people.filter(p => p.kin === 'child').length, ng = G.people.filter(g => (g.parents || []).some(id => G.people[id] && G.people[id].kin === 'child')).length;
        ok(UI.panel.querySelectorAll('.av-tier.kids .av-card').length === nk && UI.panel.querySelectorAll('.av-tier.grand .av-card').length === ng && !UI.panel.querySelector('.av-more'), `a árvore não mostra todos (${nk} filhos, ${ng} netos)`);
        { const b = UI.panel.querySelector('.snav-body'); ok(b.scrollHeight <= b.clientHeight + 2, 'a página da árvore passou da janela'); }
      } finally { Math.random = r0; }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
