// Um muro só: a muralha não aparece mais em Obras nas vilas; o Muro de Pedra (Defesa e exército) é erguido dentro da vila
// pelo governador, clicando e arrastando; no mapa ele tem a cor da muralha da vila.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      const v = World.villages[0];
      v.lord = 'player'; v.chief = null;
      // uma fileira de 7 blocos livres dentro da vila
      const okRow = (x, y) => { for (let i = 0; i < 7; i++) { const k = World.idx(x + i, y), t = World.tiles[k]; if (!TINFO[t].walk || World.isWater(t) || t === T.ROAD || t === T.BRIDGE || World.obj[k] || World.blocker(k)) return false; } return true; };
      let sp = null;
      for (let r = 3; r < 14 && !sp; r++) for (let dy = -r; dy <= r && !sp; dy++) for (let dx = -r; dx <= r && !sp; dx++) if (okRow(v.x + dx, v.y + dy)) sp = { x: v.x + dx, y: v.y + dy };
      if (!sp) return { sp };
      P.x = (sp.x + 3.5) * TILE; P.y = (sp.y + 2.5) * TILE;
      Inv.add('stone', 20);
      // menu: a muralha saiu das Obras; o muro de pedra está em Defesa e exército
      UI.sel.bcat = 'obras'; UI.showBuild();
      const obras = [...document.querySelectorAll('#panel [data-k]')].map(e => e.dataset.k);
      UI.close();
      // clicar e arrastar
      G.placing = 'wall_stone';
      G.mouse.wx = (sp.x + 0.5) * TILE; G.mouse.wy = (sp.y + 0.5) * TILE; Game.placeBuilding();
      WallDrag.held = true;
      for (let i = 1; i <= 6; i++) { G.mouse.wx = (sp.x + i + 0.5) * TILE; WallDrag.update(); }
      WallDrag.held = false;
      const row = [0, 1, 2, 3, 4, 5, 6].filter(i => { const b = World.blocker(World.idx(sp.x + i, sp.y)); return b && b.type === 'wall_stone'; }).length;
      // um trecho de muralha da vila logo ao lado, para comparar no mapa
      const vx = sp.x + 7, vy = sp.y, vk = World.idx(vx, vy);
      const vwall = !World.blocker(vk) && TINFO[World.tiles[vk]].walk && World.tiles[vk] !== T.ROAD ? World.addStruct('vwall', vx, vy, 1, 1, v.civ, { village: 0 }) : null;
      P.x = (sp.x + 60) * TILE; P.y = (sp.y + 40) * TILE; // o marcador do herói longe, para não cobrir os muros
      let mapErr = null; try { World.buildMinimap(); UI.showMap(); MapView.centerOn(sp.x + 4, sp.y, 10); } catch (e) { mapErr = String(e); }
      return { sp, vwall: !!vwall, vwallInObras: obras.includes('c:vwall'), obrasOk: obras.includes('c:well'), row, mapErr };
    });
    // no mapa grande, o seu muro tem a mesma cor da muralha da vila
    if (a.sp && a.vwall && !a.mapErr) {
      await new Promise(r => setTimeout(r, 1000));
      const c = await page.evaluate(sp => { const dpr = devicePixelRatio || 1, g = MapView.cv.getContext('2d');
        const px = (x, y) => [...g.getImageData(Math.round((x + 0.5 - MapView.ox) * MapView.z * dpr), Math.round((y + 0.5 - MapView.oy) * MapView.z * dpr), 1, 1).data].slice(0, 3).join(',');
        // a cor que mais aparece nos 7 trechos (um ou outro pode ficar sob o nome ou o marcador da vila)
        const n = {}; for (let i = 0; i < 7; i++) { const c = px(sp.x + i, sp.y); n[c] = (n[c] || 0) + 1; }
        return { mine: Object.keys(n).sort((p, q) => n[q] - n[p])[0], village: px(sp.x + 7, sp.y) }; }, a.sp);
      if (c.mine !== c.village) fails.push(`no mapa o seu muro (${c.mine}) tem cor diferente da muralha da vila (${c.village})`);
    }
    if (!a.sp) { fails.push('não achou fileira livre na vila'); return fails; }
    if (!a.obrasOk) fails.push('não conseguiu ler a lista de Obras nas vilas');
    if (a.vwallInObras) fails.push('a muralha ainda aparece em Obras nas vilas');
    if (a.row < 7) fails.push(`arrastando, só ${a.row} de 7 trechos de muro foram erguidos`);
    if (a.mapErr) fails.push('erro ao abrir o mapa: ' + a.mapErr);
    // quem pode: o governador da vila ou o rei do reino dela; os outros não (nem o rei de outro reino)
    const r = await page.evaluate(() => {
      const v = World.villages.find((x, i) => i > 0 && x && !x.free && !x.ruin && x.civ !== World.villages[0].civ); if (!v) return null;
      v.lord = null;
      const free = () => { for (let rr = 3; rr < 14; rr++) for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, x = Math.round(v.x + Math.cos(a) * rr), y = Math.round(v.y + Math.sin(a) * rr), i = World.idx(x, y), t = World.tiles[i]; if (TINFO[t].walk && t !== T.ROAD && !World.isWater(t) && !World.obj[i] && !World.blocker(i)) return { x, y }; } };
      const sp = free(); P.x = (sp.x + 0.5) * TILE; P.y = (sp.y + 2.5) * TILE;
      const other = Game.canBuild('wall_stone', sp.x, sp.y); // ainda governa a vila 0, não esta
      Game.becomeRuler(World.villages[0].civ, 'x'); const otherKing = Game.canBuild('wall_stone', sp.x, sp.y); // rei de outro reino
      v.lord = 'player'; const gov = Game.canBuild('wall_stone', sp.x, sp.y); v.lord = null;
      Game.becomeRuler(v.civ, 'x'); const king = Game.canBuild('wall_stone', sp.x, sp.y);
      return { other, otherKing, gov, king };
    });
    if (r) {
      if (!r.other || !/governador/.test(r.other)) fails.push('quem não governa a vila conseguiu erguer muro nela: ' + r.other);
      if (!r.otherKing || !/governador/.test(r.otherKing)) fails.push('o rei de outro reino conseguiu erguer muro na vila');
      if (r.gov) fails.push('o governador da vila não pôde erguer muro: ' + r.gov);
      if (r.king) fails.push('o rei do reino da vila não pôde erguer muro: ' + r.king);
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
