// Obras em qualquer lugar: base e obras se erguem em todo o mapa e nas vilas independentes, menos dentro de outro reino;
// a obra fora de onde você governa é sua (renda, responsável, interior e loja); nas obras não se produz nada.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Game.note = () => {};
      // um lugar livre com este dono de chão (-1 = terra livre), longe das construções
      const spot = (want, w, h) => {
        for (let k = 0; k < 400000; k++) {
          const x = 20 + ((k * 7919) % (WORLD_W - 40)), y = 20 + ((k * 104729) % (WORLD_H - 40));
          const t = World.terr[World.idx(x, y)]; if (want === 'foreign' ? !(t >= 0 && G.civs[t].ruler !== 'player') : t !== want) continue;
          let good = true;
          for (let j = y - 2; j < y + h + 2 && good; j++) for (let i = x - 2; i < x + w + 2 && good; i++) { const q = World.idx(i, j), tt = World.tiles[q]; if (!World.inb(i, j) || World.sgrid[q] >= 0 || tt === T.ROAD || tt === T.BRIDGE || World.isWater(tt) || !TINFO[tt].walk || World.terr[q] !== t) good = false; }
          if (!good) continue;
          for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) World.obj[World.idx(i, j)] = 0;
          return { x, y };
        }
        return null;
      };
      const go = p => { P.x = (p.x - 3) * TILE; P.y = (p.y - 3) * TILE; };
      // ----------------------------------------------------------- a base
      const f = spot('foreign', 3, 3); ok(f, 'não achei terra de outro reino');
      if (f) { go(f); ok(/terra de/.test(Game.canBuild('workbench', f.x, f.y) || ''), 'construiu a base dentro de outro reino: ' + Game.canBuild('workbench', f.x, f.y)); }
      const w = spot(-1, 4, 4); ok(w, 'não achei terra livre');
      if (w) { go(w); ok(Game.canBuild('workbench', w.x, w.y) === null, 'não deixou construir a base em terra livre: ' + Game.canBuild('workbench', w.x, w.y)); }
      // vila independente de outro governador: pode
      const fv = World.villages.findIndex(v => v && v.free && v.lord !== 'player');
      if (fv >= 0) { const v = World.villages[fv]; ok(Urban.foreignRealm(v.x, v.y, 1, 1) < 0, 'a vila independente conta como reino'); }
      // ----------------------------------------------------------- as obras
      Game.becomeRuler(G.civs.findIndex(c => c && c.ruler === 'npc' && !c.dead), 'teste'); UI.close();
      ok(Urban.hasAny(), 'não virou rei');
      // dentro de outro reino: não
      const f2 = spot('foreign', 3, 3);
      if (f2) { go(f2); const e = Urban.placeErr(Object.assign({ blocks: true }, CIVIC.vbakery), f2.x, f2.y, null, true); ok(/terra de/.test(e || ''), 'ergueu obra dentro de outro reino: ' + e); }
      // na terra livre: a obra é sua
      UI.showBuild(); UI.close();
      const types = Object.keys(UI.buildClass).filter(k => k.startsWith('c:')).map(k => k.slice(2)).filter(t => !OP_KEEP.includes(t));
      ok(types.length > 50, 'poucas obras para testar: ' + types.length);
      const built = [];
      for (const t of types) {
        const d = CIVIC[t], p = spot(-1, d.w, d.h); if (!p) { bad.push('sem lugar para ' + t); continue; }
        go(p); Urban.ghost = () => ({ x: p.x, y: p.y }); Urban.mode = 'c:' + t;
        for (const [k, n] of Object.entries(d.cost)) Inv.add(k, n);
        const n0 = World.structs.length, g0 = P.gold; Urban.click();
        const s = World.structs.slice(n0).find(o => o && o.type === t && !o.removed);
        if (!s) { bad.push(`${d.name} não foi erguida na terra livre`); continue; }
        built.push(s);
        ok(s.mine && (s.village === undefined || OP_TIED.includes(t)) && typeof s.owner === 'number', `${d.name}: não ficou sua`);
        ok(Urban.E().added.some(a => a.mine && a.type === t && a.x === s.x && a.y === s.y), `${d.name}: não ficou guardada como sua`);
        ok(!Urban.movable(s), `${d.name}: você não pode mexer na sua obra`);
        try { Game.useStruct(s); UI.close(); } catch (e) { bad.push(`${d.name}: erro ao usar: ${e.message}`); }
        if (Work.def(s)) ok(/^(Sua|Seu) /.test(Work.def(s).name()), `${d.name}: nome sem "Sua/Seu"`);
      }
      Urban.mode = null;
      Shops.ensure();
      // todo prédio com responsável tem alguém cuidando e a loja dele
      for (const s of built) if (SHOP_KEEPER[s.type] !== undefined) {
        ok(Shops.isShop(s), `${CIVIC[s.type].name}: sem responsável`);
        ok(Shops.keeper(s), `${CIVIC[s.type].name}: ninguém cuidando`);
      }
      // as Casas de Aluguel ganharam responsável, interior e loja
      ok(SHOP_KEEPER.vtenement === 'landlord' && WORKPLACES.vtenement && Work.shopOf({ type: 'vtenement', owner: 0 }), 'as Casas de Aluguel não têm responsável, interior e loja');
      for (const t of ['observatory', 'archer_tower', 'barracks']) ok(Work.shopOf({ type: t, owner: 'player' }), `${BUILDINGS[t].name}: o responsável não abre a loja`);
      ok(!expFn('war_stable').farm, 'o Estábulo de Guerra ainda produz');
      // a renda das suas obras vai para você
      const g0 = P.gold; ObrasPlus.monthTick(); ok(P.gold > g0, 'as suas obras não renderam');
      // não entram no traçado das vilas
      ok(!World.villages.some((v, vi) => v && TownPlan.members(vi).some(s => s.mine)), 'obra sua no traçado de uma vila');
      // demolir devolve e tira do jogo salvo
      const s0 = built[0]; if (s0) { Urban.doDemolish(s0); ok(!Urban.E().added.some(a => a.x === s0.x && a.y === s0.y && a.type === s0.type), 'a obra demolida ficou no jogo salvo'); }
      // na sua vila (do seu reino) a obra continua da vila
      const mv = World.villages.findIndex(v => v && !v.free && G.civs[v.civ].ruler === 'player');
      if (mv >= 0) { const v = World.villages[mv]; ok(!ObrasPlus.home(v.x + 2, v.y + 2, 2, 2).mine, 'obra na vila do seu reino ficou sua'); }
      // o mês roda sem erro
      Lifesim.monthTick(); while (Perf.queue.length) Perf.queue.shift()();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
