// Tela de passagem e cavalo: ao entrar num imóvel a cortina cobre a tela e some sozinha em menos de 1 s; quem entra
// montado sai montado (e quem entra a pé sai a pé); no menu a cortina não aparece.
'use strict';
const { open } = require('./harness');
const wait = ms => new Promise(r => setTimeout(r, ms));
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  const shown = () => page.evaluate(() => { const el = document.getElementById('trans'); return !!el && !el.classList.contains('hidden') && !el.classList.contains('out'); });
  try {
    await page.evaluate(() => {
      P.god = true; P.horse = { name: 'Trovão', color: '#7a4a26' }; P.mounted = true;
      const s = World.structs.find(x => x && !x.removed && x.type === 'tavern' && Places.def(x));
      P.x = (s.x + s.w / 2) * TILE; P.y = (s.y + s.h + 1) * TILE; window._s = s;
      Places.enterRoom(s);
    });
    if (!(await shown())) fails.push('a cortina não apareceu ao entrar no imóvel');
    await wait(1000);
    if (await shown()) fails.push('a cortina não sumiu depois de 1 s');
    const inside = await page.evaluate(() => ({ place: !!G.place, mounted: P.mounted }));
    if (!inside.place) fails.push('não entrou no imóvel');
    if (inside.mounted) fails.push('dentro do imóvel continua montado');
    await page.evaluate(() => Places.exit());
    if (!(await shown())) fails.push('a cortina não apareceu ao sair');
    await wait(1000);
    const out = await page.evaluate(() => ({ mounted: P.mounted }));
    if (!out.mounted) fails.push('entrou montado e saiu a pé');
    // a pé entra, a pé sai
    await page.evaluate(() => { P.mounted = false; Places.enterRoom(_s); });
    await wait(800);
    await page.evaluate(() => Places.exit());
    await wait(800);
    if (await page.evaluate(() => P.mounted)) fails.push('entrou a pé e saiu montado');
    // indo para o menu de dentro de um imóvel: sem cortina
    await page.evaluate(() => { Places.enterRoom(_s); });
    await wait(800);
    await page.evaluate(() => Game.toMenu());
    await wait(100);
    if (await shown()) fails.push('a cortina apareceu ao voltar para o menu');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
