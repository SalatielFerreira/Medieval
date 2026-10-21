// Cemitério e arena: quem governa um reino ergue e muda os dois para qualquer lugar do mapa (até fora do reino), menos em
// cima de imóvel, estrada ou vegetação; quem não governa não consegue; tudo continua no lugar depois de salvar e carregar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      const find = (t, ci) => World.structs.find(s => s && s.type === t && s.owner === ci && !s.removed);
      const refused = !!Urban.movable(find('cemetery', 1)); // não governa o reino 1
      P.god = true; Game.becomeRuler(0, 'Teste.');
      const c = find('cemetery', 0), ok = !Urban.movable(c);
      // lugares livres longe, fora do reino 0
      const spots = [];
      for (let y = 20; y < WORLD_H - 20 && spots.length < 4; y += 3) for (let x = 20; x < WORLD_W - 20 && spots.length < 4; x += 3) {
        if (World.terr[World.idx(x, y)] === 0 || U.dist(x, y, c.x, c.y) < 60 || spots.some(q => U.dist(q.x, q.y, x, y) < 12)) continue;
        if (!Graves.spotErr(null, x, y, false, 6, 4)) spots.push({ x, y });
      }
      if (spots.length < 4) return { refused, ok, spots };
      // regras: vegetação, estrada e outro imóvel impedem
      let tree = null; for (let i = 0; i < World.obj.length && !tree; i++) if (World.obj[i] && World.sgrid[i] < 0) tree = { x: i % WORLD_W, y: Math.floor(i / WORLD_W) };
      const vegErr = tree ? Graves.spotErr(c, tree.x, tree.y, false, 6, 4) : 'sem árvore';
      const other = World.structs.find(s => s && !s.removed && s.type === 'vhouse');
      const houseErr = Graves.spotErr(c, other.x, other.y, false, 6, 4);
      // mudar o cemitério
      Urban.relocate(c, spots[0].x, spots[0].y);
      // erguer uma arena e um cemitério novos (fora do reino) e mudar a arena original
      Inv.add('stone', 500); Inv.add('wood', 500); Inv.add('iron_bar', 50);
      const mk = (t, sp) => { Urban.start('c:' + t); G.mouse.wx = (sp.x + CIVIC[t].w / 2) * TILE; G.mouse.wy = (sp.y + CIVIC[t].h / 2) * TILE; const g = Urban.ghost(CIVIC[t].w, CIVIC[t].h); Urban.click(); return World.structs.find(s => s && !s.removed && s.type === t && s.x === g.x && s.y === g.y); };
      const ar = mk('arena', spots[1]), nc = mk('cemetery', spots[2]);
      // e a catedral do reino
      const cat = find('cathedral', 0), catOk = !Urban.movable(cat) && !Urban.placeErr(cat, spots[3].x, spots[3].y, cat, Urban.isCivic(cat)) && !!Urban.movable(find('cathedral', 1));
      if (catOk) Urban.relocate(cat, spots[3].x, spots[3].y);
      return { refused, ok, spots, vegErr, houseErr, cem: { x: c.x, y: c.y }, arena: ar && { x: ar.x, y: ar.y, owner: ar.owner }, newCem: nc && { x: nc.x, y: nc.y, owner: nc.owner }, catOk, cat: { x: cat.x, y: cat.y } };
    });
    if (!a.refused) fails.push('quem não governa conseguiu mexer no cemitério de outro reino');
    if (!a.ok) fails.push('o rei não pôde mudar o cemitério');
    if (!a.catOk) fails.push('a catedral não pôde ser mudada pelo rei (ou outro reino deixou)');
    if (!a.spots || a.spots.length < 4) { fails.push('não achou lugares livres longe do reino'); return fails; }
    if (!a.vegErr) fails.push('deixou pôr o cemitério em cima de vegetação');
    if (!a.houseErr) fails.push('deixou pôr o cemitério em cima de uma casa');
    if (!a.arena || a.arena.owner !== 0) fails.push('a arena não foi erguida fora do reino (ou ficou com o reino errado)');
    if (!a.newCem || a.newCem.owner !== 0) fails.push('o cemitério novo não foi erguido fora do reino');
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const b = await page.evaluate(() => World.structs.filter(s => s && !s.removed && ['cemetery', 'arena', 'cathedral'].includes(s.type) && s.owner === 0).map(s => `${s.type}@${s.x},${s.y}`));
    for (const [t, p] of [['cemetery', a.cem], ['arena', a.arena], ['cemetery', a.newCem], ['cathedral', a.cat]]) if (p && !b.includes(`${t}@${p.x},${p.y}`)) fails.push(`${t} em ${p.x},${p.y} sumiu depois de carregar (há: ${b.join(' ')})`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
