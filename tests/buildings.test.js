// Entrar em todo prédio pela porta (como o jogador), e cada estabelecimento negociando com o responsável.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      P.god = true; G.time = NIGHT_LEN + DAYLIGHT_LEN * 0.3; G.day = 5;
      const v = World.villages.find(v => v.civ === 1), vi = World.villages.indexOf(v);
      v.prosper = 999; Towns.dayTick();
      const spot = (w, h, cx, cy) => { for (let r = 6; r < 80; r++) for (let k = 0; k < 48; k++) { const a = k / 48 * 6.283, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (World.areaOk(x - 1, y - 1, w + 2, h + 4) && World.areaFree(x - 1, y - 1, w + 2, h + 4)) return { x, y }; } return null; };
      for (const t of Object.keys(WORKPLACES).filter(t => WORKPLACES[t][3] === 'npc' && t.startsWith('v'))) { const d = CIVIC[t], p = spot(d.w, d.h, v.x, v.y); if (p) Urban.addCivic(t, p.x, p.y, vi, true); }
      const px = Math.floor(P.x / TILE), py = Math.floor(P.y / TILE);
      for (const t of Object.keys(WORKPLACES).filter(t => WORKPLACES[t][3] === 'player')) { const d = BUILDINGS[t], p = spot(d.w, d.h, px, py); if (p) World.addStruct(t, p.x, p.y, d.w, d.h, 'player', { built: true, animals: {}, goods: {} }); }
      Shops.ensure();
      const bad = [];
      const seen = new Set();
      for (const s of World.structs.slice()) {
        if (!s || s.removed || s.hidden || !WORKPLACES[s.type] || seen.has(s.type + s.owner)) continue; seen.add(s.type + s.owner);
        P.x = (s.x + s.w / 2) * TILE; P.y = (s.y + s.h + 0.35) * TILE + 6;
        if (Game.nearestInteract() !== s) { bad.push(s.type + ': sem interação'); continue; }
        Game.interact();
        if (!(G.place && G.place.kind === 'room')) { bad.push(s.type + ': não entrou'); continue; }
        if (!Shops.keeper(s)) bad.push(s.type + ': sem responsável');
        const counter = Places.furn.find(f => f.act === 'work');
        if (Work.shopOf(s) && counter) { Places.use(counter); if (!document.querySelector('.shopowner')) bad.push(s.type + ': balcão não negocia'); UI.close(); }
        Places.exit(true); UI.close();
      }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
