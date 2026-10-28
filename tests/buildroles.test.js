// O que cada categoria de construção faz: produção só fabrica (sem lado de dentro nem responsável) e mostra o que
// produz; fazenda abre a loja do responsável (que anda livre) junto com o que já se fazia; cultura e obras têm lado de
// dentro, responsável e loja; a Defesa está nas Obras (só onde você governa); a infraestrutura retirada saiu do menu;
// a Estrebaria vende cavalos; o muro se emenda no portão.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 5000;
      const v = World.villages[0], at = (k, npc) => { const d = npc ? CIVIC[k] : BUILDINGS[k]; return World.addStruct(k, v.x + 40, v.y + 40, d.w, d.h, npc ? v.civ : 'player', npc ? { village: 0 } : { built: true }); };
      const opened = s => { let fn = null; const o = UI.open; UI.open = function (t, b, f, a) { fn = f + ':' + (a && a[0]); }; try { Game.useStruct(s); } finally { UI.open = o; } return fn; };
      // produção
      for (const k of BR.PROD) {
        const s = at(k); Shops.ensure();
        ok(!Places.def(s), `${k}: produção com lado de dentro`); ok(!Shops.keeper(s), `${k}: produção com responsável`);
        const fn = opened(s); ok(fn && fn.startsWith('showCrafting'), `${k}: não abre a fabricação (${fn})`);
        World.removeStruct(s);
      }
      UI.sel.bcat = 'producao'; UI.sel.build = 'forge'; UI.showBuild(); ok(html().includes('Pode produzir'), 'a ficha da produção não mostra o que produz');
      // fazenda
      for (const k of BR.FARM) {
        const s = at(k); Shops.ensure(); const kp = Shops.keeper(s);
        ok(!Places.def(s), `${k}: fazenda com lado de dentro`); ok(kp, `${k}: fazenda sem responsável`);
        if (kp) ok(!Shops.workOf(kp), `${k}: o responsável fica parado no imóvel`);
        Game.useStruct(s); ok(UI.cur && UI.cur.fn === 'showShop' && html().includes('Cuidar do lugar'), `${k}: não abriu a loja com o que se fazia ali`);
        UI.close(); World.removeStruct(s);
      }
      // cultura
      for (const k of BR.CULT) {
        const s = at(k); Shops.ensure(); const kp = Shops.keeper(s);
        ok(Places.def(s), `${k}: cultura sem lado de dentro`); ok(kp, `${k}: cultura sem responsável`);
        try { P.x = (s.x + s.w / 2) * TILE; P.y = (s.y + s.h + 1) * TILE; Places.enterRoom(s); ok(G.place, `${k}: não entrou`); Places.exit(true); } catch (e) { bad.push(`${k}: erro ao entrar — ${String(e).slice(0, 80)}`); }
        if (kp) { UI.talkAct({ op: 'shopnpc', id: kp.id }); ok(UI.cur && UI.cur.fn === 'showShop', `${k}: o responsável não negocia`); UI.close(); }
        World.removeStruct(s);
      }
      // obras com lado de dentro
      for (const k of Object.keys(BR_ROOMS).filter(t => CIVIC[t])) {
        const s = at(k, true); Shops.ensure(); ok(Places.def(s) && Shops.keeper(s) && Work.shopOf(s), `${k}: obra sem interior, responsável ou loja`); World.removeStruct(s);
      }
      // menu: sem Defesa (fora das obras) e sem a infraestrutura retirada
      UI.showBuild(); ok(!UI.buildCats.some(c => c[0] === 'defesa'), 'a Defesa ainda está no seu menu');
      ok(!UI.buildCats.flatMap(c => c[3]).some(k => BR.INFRA_OUT.includes(k)), 'a infraestrutura retirada ainda aparece');
      const px = Math.floor(P.x / TILE), py = Math.floor(P.y / TILE); ok(Game.canBuild('barracks', px + 3, py + 3) !== null, 'quartel construído fora de uma vila sua');
      Game.becomeRuler(v.civ, 't'); UI.close(); UI.sel.bcat = 'obras'; UI.sel.build = 'barracks'; UI.showBuild();
      ok(UI.buildCats.find(c => c[0] === 'obras')[3].includes('barracks') && UI.sel.build === 'barracks', 'a Defesa não está nas Obras');
      // Estrebaria: cavalos
      UI.showShop('stable', 0); ok(html().includes('Comprar um cavalo'), 'a Estrebaria não vende cavalos');
      P.gold = 1000; Ride.buy('horse', BR_HORSE); ok(P.horse, 'não comprou o cavalo');
      // o muro emenda no portão: o trecho colado nele vai até a borda (sem portão, pararia antes)
      const y = v.y + 18; for (const dx of [-2, -1]) { const i = World.idx(v.x + dx, y); World.obj[i] = 0; World.addStruct('wall_stone', v.x + dx, y, 1, 1, 'player', { built: true }); }
      const w = World.structs.find(s => s.type === 'wall_stone' && s.x === v.x - 1 && s.y === y);
      const reach = () => { let mx = 0; const ctx = { fillRect: (x, yy, ww) => { mx = Math.max(mx, x + ww); }, beginPath() {}, moveTo() {}, lineTo() {}, fill() {}, set fillStyle(c) {} }; World.drawWall(ctx, w, 0, 0, true); return mx; };
      const before = reach(); World.obj[World.idx(v.x, y)] = 0; Urban.addCivic('vgate', v.x, y, 0, true);
      ok(World.structs.some(s => s.type === 'vgate' && s.x === v.x && s.y === y && !s.removed), 'o portão não foi posto');
      ok(reach() > before, `o muro não se emenda no portão (${before} → ${reach()})`);
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
