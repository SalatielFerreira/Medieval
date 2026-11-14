// Cão de guarda: ficar e proteger um lugar ou vir com você (botão em cima do cão, tecla H), a ordem guardada no jogo
// salvo, e a vida que volta sozinha.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, frames = n => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
      UI.msg = () => {}; P.god = true;
      const s = freeSpotNear(P.x + 90, P.y, 80), tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE);
      World.addStruct('kennel', tx, ty, BUILDINGS.kennel.w, BUILDINGS.kennel.h, 'player'); Content2.dogDue = true; Content2.dogT = 0;
      for (let k = 0; k < 5 && !Dogs.list().length; k++) Content2.update(1.1);
      const d = Dogs.list()[0]; ok(d, 'o canil não deu um cão'); if (!d) return bad;
      // o botão aparece perto do cão
      d.x = P.x + 30; d.y = P.y; await frames(3); const el = document.getElementById('dogBtn');
      ok(el && el.style.display === 'flex' && /Ficar/.test(el.textContent), 'o botão de mandar o cão ficar não apareceu');
      // ficar: ele não segue quando você vai embora
      el.click(); ok(d.stay && !d.follow, 'o cão não ficou');
      const sx = d.x, sy = d.y; P.x += 20 * TILE; for (let k = 0; k < 60; k++) { Content2.update(0.05); d.update(0.05); }
      ok(U.dist(d.x, d.y, sx, sy) < 5 * TILE, 'o cão guardando foi atrás de você');
      ok(Dogs.S().stay[0] && Math.abs(Dogs.S().stay[0].x - sx) < 2, 'a ordem de ficar não foi guardada');
      // tecla H: todos vêm
      Dogs.toggleAll(); ok(!d.stay && d.follow === P, 'a tecla H não chamou o cão de volta');
      Dogs.toggleAll(); ok(d.stay, 'a tecla H não mandou o cão ficar');
      // a ordem vale para o cão que aparece ao carregar o jogo
      const st = Dogs.S().stay[0]; d.dead = true; G.ents = G.ents.filter(e => e !== d); Content2.dogDue = true; Content2.dogT = 0;
      for (let k = 0; k < 5 && !Dogs.list().length; k++) Content2.update(1.1);
      const d2 = Dogs.list()[0]; ok(d2 && d2.stay && U.dist(d2.x, d2.y, st.x, st.y) < 3 * TILE, 'o cão novo não voltou para o lugar guardado');
      // a vida volta sozinha
      if (d2) { d2.hp = 10; d2.hurt = -5; d2.target = null; for (let k = 0; k < 40; k++) Dogs.update(1); ok(d2.hp >= d2.maxHp - 0.5, `a vida do cão não voltou sozinha (${Math.round(d2.hp)}/${d2.maxHp})`); }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
