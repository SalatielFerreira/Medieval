// Cerco às vilas: o governador melhora a defesa da vila (muralha, torres, milícia) e os da IA melhoram sozinhos; no
// Conselho de Guerra dá para atacar uma vila do inimigo no campo de batalha (paliçada ou muralha, portão e quem comanda);
// vencer passa a vila para o seu reino e cada vila perdida enfraquece o portão do castelo; o inimigo também ataca uma
// vila sua e, se você perder, ela passa para ele.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, r0 = Math.random;
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 20000;
      try {
        const side = 1, enemy = 2; Game.becomeRuler(side, 'teste'); UI.close(); G.civs[side].garrison = 30; G.civs[side].treasury = 8000; G.civs[enemy].treasury = 3000;
        // 1. o governador melhora a defesa
        const myV = VillageAssault.mineTargets(side)[0]; myV.v.lord = 'player';
        const g0 = VillageDef.gateMax(myV.vi); UI.act('vdef', { v: myV.vi, k: 'walls' }); ok(VillageDef.D(myV.v).walls === 1 && VillageDef.gateMax(myV.vi) > g0, 'o governador não melhorou a muralha');
        ok(/Defesa da vila/.test(Reinado.village(myV.vi)), 'a página da vila não mostra a defesa');
        const other = VillageAssault.targets(side, enemy)[0]; const w0 = VillageDef.D(other.v).walls + VillageDef.D(other.v).towers + VillageDef.D(other.v).militia;
        ok(!VillageDef.upgrade(other.vi, 'walls'), 'quem não é governador mudou a defesa de outra vila');
        Era.S().start = G.day - 700; Math.random = () => 0; VillageDef.npcTick(); Math.random = r0; Era.S().start = G.day; // (as defesas da IA acompanham as eras)
        ok(VillageDef.D(other.v).walls + VillageDef.D(other.v).towers + VillageDef.D(other.v).militia > w0, 'o governador da IA não melhorou a defesa');
        // 2. atacar uma vila do inimigo
        const t = VillageAssault.targets(side, enemy)[0];
        G.warCall = { side, enemy, own: true, day: G.day, shown: true, deadline: null, cfg: Object.assign(War.defaults(side, true), { cats: 1 }) };
        UI.showWarCouncil(); ok(UI.panel.querySelector(`[data-act="vassault"][data-v="${t.vi}"]`), 'o Conselho de Guerra não oferece atacar a vila');
        UI.act('vassault', { v: t.vi }); const A = Assault.A();
        ok(A && A.village === t.vi && Places.furn.some(f => f.k === 'cgate') && Places.furn.some(f => f.k === 'bf_house'), 'o cerco à vila não montou o campo');
        for (let k = 0; k < 100; k++) Game.update(0.05); Game.render();
        Assault.hitGate(A.gateMax + 10, P.x, P.y); ok(A.gateHp <= 0, 'o portão da vila não caiu');
        const cmd = War.units(enemy).find(e => e.battleKing); ok(cmd, 'ninguém comanda a vila'); if (cmd) cmd.dead = true;
        for (let k = 0; k < 40 && G.place; k++) Game.update(0.05);
        ok(t.v.civ === side && !G.place, 'vencer não passou a vila para o seu reino');
        UI.close();
        // 3. o castelo fica mais fraco sem as vilas
        for (const x of VillageAssault.targets(side, enemy)) x.v.civ = side;
        G.warCall = { side, enemy, own: true, day: G.day, shown: true, deadline: null, cfg: War.defaults(side, true), assault: 'attack' }; War.start();
        const C = Assault.A(); ok(C && C.village === undefined && C.gateMax <= 3000 * 0.41 + (G.civs[enemy].invest && G.civs[enemy].invest.walls ? G.civs[enemy].invest.walls * 400 : 0), 'o portão do castelo não enfraqueceu sem as vilas: ' + (C && C.gateMax));
        War.finish(false); UI.close();
        // 4. o inimigo ataca uma vila sua e você perde
        G.warRest = {}; const mv = VillageAssault.mineTargets(side)[0];
        G.warCall = { side, enemy, own: true, day: G.day, shown: true, deadline: null, cfg: War.defaults(side, true), assault: 'vdefend', vi: mv.vi };
        UI.showWarCouncil(); ok(UI.panel.querySelector('[data-act="vdefgo"]'), 'o conselho não mostra a defesa da vila');
        UI.act('vdefgo', {}); ok(Assault.A() && Assault.A().mode === 'defend', 'a defesa da vila não começou');
        War.finish(false); ok(mv.v.civ === enemy, 'perder a defesa não passou a vila para o inimigo');
      } finally { Math.random = r0; }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
