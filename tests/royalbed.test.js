// Quarto real: dentro do castelo, a cama do rei (salvar e dormir); quem não é o rei não usa.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }; const msgs = []; UI.msg = (m) => msgs.push(m);
      const cas = World.structs.find(s => s && s.type === 'castle' && !s.removed && s.owner === 1);
      // ainda não é o rei: os guardas não deixam
      Places.enterRoom(cas); ok(G.place && G.place.lay === 'throne', 'não entrou na sala do trono');
      const bed = Places.furn.find(f => f.act === 'royalbed'); ok(bed, 'a sala do trono não tem a cama real');
      if (bed) { ok(/Quarto real/.test(Places.furnLabel(bed)), 'a cama real não diz o que faz'); Places.use(bed); ok(!UI.isOpen() && msgs.some(m => /só do rei/.test(m)), 'quem não é o rei usou o quarto real'); }
      Places.exit(true);
      // rei: dorme e salva, e o castelo vira o ponto de retorno
      Game.becomeRuler(1, 'teste'); UI.close(); Places.enterRoom(cas);
      const bed2 = Places.furn.find(f => f.act === 'royalbed'); Places.use(bed2);
      ok(UI.cur && UI.cur.fn === 'royalBedUI' && /Dormir até o amanhecer/.test(UI.panel.innerText), 'o quarto real não abriu para o rei');
      UI.refresh(); ok(UI.cur && UI.cur.fn === 'royalBedUI', 'a janela do quarto real não se redesenha');
      P.hp = 1; G.spawn = null; UI.act('sleep', { s: cas.id });
      ok(P.hp === P.maxHp && G.spawn && Math.abs(G.spawn.x / TILE - (cas.x + cas.w / 2)) < 1, 'dormir no quarto real não recuperou a vida ou não mudou o ponto de retorno');
      return bad;
    });
    fails.push(...r);
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + '/throne.png' });
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
