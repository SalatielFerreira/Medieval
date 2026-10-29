// Navegação: comprar navio no porto, carregar o porão e vender em outro porto, viajar (com tempestades e piratas),
// piratas em alto-mar, salvar o navio; música por lugar; placar da dinastia e conquistas novas.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 20000;
      // dois portos (no mundo de teste pode não haver costa: põe na água mais perto de dois castelos)
      let ports = Ports.list();
      if (ports.length < 2) for (const ci of [0, 3]) { const cp = World.capitals[ci]; World.addStruct('port', cp.x + 6, cp.y + 6, 4, 3, ci); }
      ports = Ports.list(); const A = ports[0], B = ports[1];
      UI.showPort(A.id); ok(html().includes('Estaleiro'), 'o porto não tem estaleiro');
      Sea.buy('caravel'); ok(G.ship && G.ship.kind === 'caravel', 'não comprou a caravela'); ok(Sea.speed() > 1, 'o navio não é mais rápido');
      UI.showPort(A.id); ok(html().includes('Comércio por mar') && html().includes('Zarpar para'), 'o porto não mostra comércio e viagens');
      const k = Sea.goods()[0], g0 = P.gold; Sea.load(A.id, k, 10); ok(G.ship.hold[k] === 10 && P.gold < g0, 'não carregou o porão');
      const g1 = P.gold; Sea.unload(B.id, k, 1e9); ok(!G.ship.hold[k] && P.gold > g1, 'não vendeu a carga');
      // viagem sem acidentes
      const rnd = Math.random; Math.random = () => 0.9;
      try { const di = Sea.dests(A).findIndex(d => d.kind === 'port' && d.s === B); Sea.sail(A.id, di); } finally { Math.random = rnd; }
      ok(!G.voyage && U.dist(P.x / TILE, P.y / TILE, B.x, B.y) < 12, 'a viagem não chegou ao outro porto');
      ok((G.stats.voyages || 0) >= 1, 'a viagem não contou');
      // piratas no caminho: lutar e vencer
      G.ship.hull = 120; Math.random = () => 0.2;
      try { Sea.sail(B.id, Sea.dests(B).findIndex(d => d.kind === 'port')); } finally { Math.random = rnd; }
      ok(G.voyage && G.voyage.pirates && UI.cur && UI.cur.fn === 'seaPirates', 'os piratas não apareceram');
      Math.random = () => 0.01; try { Sea.pirates('pfight'); } finally { Math.random = rnd; }
      ok((G.stats.kill_pirate || 0) > 0, 'a vitória contra os piratas não contou');
      // naufrágio
      G.ship.hull = 1; G.ship.hold = { [k]: 5 }; Sea.wreck([]); ok(!G.ship, 'o navio sem casco não afundou');
      // piratas em alto-mar
      Sea.buy('galleon'); const n0 = G.ents.filter(e => e.kind === 'pirate').length; Sea.spawnPirates(); const pir = G.ents.filter(e => e.kind === 'pirate');
      if (pir.length > n0) { ok(pir[0].sailing, 'pirata sem barco'); const cv = document.createElement('canvas').getContext('2d'); pir[0].draw(cv, 0, 0); }
      // música por lugar
      // uma música só, alegre e leve, em todo lugar (sem tambor e sem bordão)
      ok(Object.keys(Sound.TUNES).join() === 'alegre', 'ainda há outras músicas: ' + Object.keys(Sound.TUNES).join());
      { const T0 = Sound.TUNES.alegre; ok(T0.drum.every(d => !d) && T0.jingle.every(d => !d) && T0.nodrone && T0.mel.reduce((a, m) => a + m[1], 0) % T0.bar === 0, 'a música alegre tem marcação ou compasso quebrado'); }
      for (const m of ['battle', 'cave', 'night', 'menu']) { Sound.music(m); ok(Sound.wantMode === 'alegre', `em ${m} toca outra música: ` + Sound.wantMode); }
      // placar da dinastia
      UI.showLegacy(); ok(html().includes('Placar') || html().includes('Pontos'), 'janela do placar'); ok(Book.pages().some(p => p.includes('O placar das gerações')), 'o livro não tem o placar');
      const n = Legacy.now(); ok(n.gold === Math.round(P.gold), 'placar da geração de agora');
      ok(ACHIEVEMENTS.filter(a => ['deep', 'legend', 'ship', 'pirates10', 'explorer', 'charges'].includes(a.id)).length === 6, 'conquistas novas faltando');
      Progress.check();
      return bad;
    });
    fails.push(...r);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const s = await page.evaluate(() => G.ship && G.ship.kind);
    if (s !== 'galleon') fails.push('o navio não voltou ao carregar: ' + s);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
