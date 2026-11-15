// Missão "construir 2 coisas" da sociedade secreta: o texto explica o que vale, o botão abre o menu Construir e duas
// construções quaisquer (feitas depois de a missão chegar) cumprem a missão.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const K = KOrders.S(); K.key = 'crafts'; K.pts = 0; K.mission = { k: 'build', until: G.day + 3, base: Progress.S().built || 0 };
      ok(/menu Construir/.test(KO_MISSIONS.build.text) && KO_MISSIONS.build.how, 'o texto da missão não explica o que fazer');
      // a página da sociedade mostra a dica e o botão
      UI.sel.knav = 'x:ordens'; UI.showKingdom(); const h = UI.panel ? UI.panel.innerHTML : '';
      ok(/💡/.test(h) && h.includes('data-act="kogo"'), 'a página da sociedade não mostra como fazer a missão nem o botão');
      UI.act('kogo', { k: 'showBuild' }); ok(UI.cur && UI.cur.fn === 'showBuild', 'o botão da missão não abriu o menu Construir'); UI.close();
      // duas construções quaisquer cumprem a missão
      const pts0 = K.pts; Inv.add('wood', 200); Inv.add('iron_bar', 20); Inv.add('plank', 40); Inv.add('stone', 40);
      let built = 0;
      for (let n = 0; n < 400 && built < 2; n++) {
        const s = freeSpotNear(P.x + 40 + n, P.y + 30, 120), tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE);
        if (Game.canBuild('chest', tx, ty)) continue;
        G.placing = 'chest'; G.mouse.wx = (tx + 0.5) * TILE; G.mouse.wy = (ty + 0.5) * TILE;
        const b0 = Progress.S().built || 0; try { Game.placeBuilding(); } catch (e) { /* lugar */ } if ((Progress.S().built || 0) > b0) built++;
      }
      ok(built === 2, `não deu para construir 2 baús (${built})`);
      ok(K.pts === pts0 + 1 && (!K.mission || K.mission.k !== 'build' || K.mission.base >= (Progress.S().built || 0)), 'construir 2 coisas não cumpriu a missão na hora');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
