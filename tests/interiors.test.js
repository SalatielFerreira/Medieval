// Interiores das construções novas: cada uma tem o lado de dentro (entra e sai sem erro), um responsável do ofício do
// lugar e uma loja com mercadoria que tem a ver com o prédio (aberta no balcão ou pela conversa).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      P.god = true;
      const v = World.villages[0], vi = 0, out = [];
      v.lord = 'player';
      const spot = (w, h) => { for (let rr = 8; rr < 70; rr++) for (let k = 0; k < 48; k++) { const a = k / 48 * 6.283, x = Math.round(v.x + Math.cos(a) * rr), y = Math.round(v.y + Math.sin(a) * rr); if (World.areaOk(x - 1, y - 1, w + 2, h + 4) && World.areaFree(x - 1, y - 1, w + 2, h + 4)) return { x, y }; } };
      // (produção e fazenda ficam sem lado de dentro: buildroles.test.js)
      for (const [type, row] of Object.entries(WP2).filter(([t]) => !BR.PROD.includes(t) && !BR.FARM.includes(t))) {
        const mine = row[3] === 'player', d = mine ? BUILDINGS[type] : CIVIC[type];
        if (!d) { out.push(`${type}: não existe no jogo`); continue; }
        const sp = spot(d.w, d.h); if (!sp) { out.push(`${type}: sem lugar livre para o teste`); continue; }
        const s = mine ? World.addStruct(type, sp.x, sp.y, d.w, d.h, 'player', { built: true }) : Urban.addCivic(type, sp.x, sp.y, vi);
        Shops.ensure();
        const k = Shops.keeper(s);
        if (!Places.def(s)) { out.push(`${type}: sem interior`); continue; }
        if (!k) { out.push(`${type}: sem responsável`); continue; }
        if (k.rank !== row[0]) out.push(`${type}: o responsável é ${k.rank}, deveria ser ${row[0]}`);
        try { P.x = (s.x + s.w / 2) * TILE; P.y = (s.y + s.h + 1) * TILE; Places.enterRoom(s); if (!G.place) out.push(`${type}: não entrou`); Places.exit(true); }
        catch (e) { out.push(`${type}: erro ao entrar — ${String(e).slice(0, 100)}`); try { Places.exit(true); } catch (e2) { /* */ } }
        // a loja dele, pela conversa
        UI.talkAct({ op: 'shopnpc', id: k.id });
        const rows = document.querySelectorAll('#panel .trd-col:first-child .trd-row').length;
        if (!rows) out.push(`${type}: a loja do responsável não tem mercadoria`);
        UI.close();
      }
      return { n: Object.keys(WP2).filter(t => !BR.PROD.includes(t) && !BR.FARM.includes(t)).length, out };
    });
    fails.push(...r.out);
    console.log(`    ${r.n} construções conferidas`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
