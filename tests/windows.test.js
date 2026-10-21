// Abre as janelas do jogo uma a uma: todas abrem sem erro e ocupam a tela inteira (no computador e no celular deitado).
'use strict';
const { open } = require('./harness');
const WINS = ['UI.showInventory()', 'UI.showCrafting(null)', 'UI.showBuild()', "UI.sel.knav='overview'; UI.showKingdom()", "UI.sel.dtab='news'; UI.showDiary()",
  'UI.showSettings()', 'UI.showHelp()', 'UI.showTalk(X.npc)', 'UI.showGift(X.npc)', 'UI.showHire(X.npc)', 'UI.showProf(X.npc)', 'UI.showGuard(X.npc)', 'UI.showEquipC(X.npc)',
  'UI.showCastle(1)', 'UI.showFamily(X.fam)', 'UI.showBiz(X.bz)', 'UI.showBizShop(X.bz)', 'UI.showFinance()', "UI.showLoans('merchant', 0, X.npc)",
  'UI.showRest(X.house)', 'UI.showChest(X.house)', 'UI.showStable(X.stable)', 'UI.showFarm()', 'UI.showBarracks()', 'UI.showArsenal(null)', 'UI.showCemetery(0)', 'UI.showWarEnvoy(0, 1)'];
async function run(width, height) {
  const { page, errors, close } = await open({ width, height }), fails = [];
  try {
    const r = await page.evaluate(async WINS => {
      P.god = true; P.gold = 5000; Game.becomeRuler(0, 'Teste.');
      const v = World.villages[0];
      const spot = (w, h) => { for (let r = 12; r < 60; r++) for (let k = 0; k < 48; k++) { const a = k / 48 * 6.283, x = Math.round(v.x + Math.cos(a) * r), y = Math.round(v.y + Math.sin(a) * r); if (World.areaOk(x - 1, y - 1, w + 2, h + 4) && World.areaFree(x - 1, y - 1, w + 2, h + 4)) return { x, y }; } };
      const add = t => { const sp = spot(BUILDINGS[t].w, BUILDINGS[t].h); return World.addStruct(t, sp.x, sp.y, BUILDINGS[t].w, BUILDINGS[t].h, 'player', { built: true }); };
      const npc = G.people.find(p => p.alive && !p.kin && p.age > 20 && p.home.type === 'village' && p.shop);
      window.X = { bz: add('biz_shop').id, npc: npc.id, fam: npc.fam, house: add('house').id, stable: add('stable').id };
      const out = [];
      for (const code of WINS) {
        try { UI.close(); new Function(code)(); } catch (e) { out.push(`${code}: ${String(e).slice(0, 120)}`); continue; }
        const pn = document.getElementById('panel'), b = pn.getBoundingClientRect();
        if (pn.classList.contains('hidden')) out.push(`${code}: a janela não abriu`);
        else if (Math.round(b.width) < innerWidth - 2 || Math.round(b.height) < innerHeight - 2) out.push(`${code}: ${Math.round(b.width)}×${Math.round(b.height)} em vez da tela inteira`);
      }
      UI.close();
      return out;
    }, WINS);
    fails.push(...r.map(x => `${width}×${height} · ${x}`));
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
}
module.exports = async () => [...await run(1366, 720), ...await run(844, 390)];
