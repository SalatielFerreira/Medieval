// Assassinos só no mundo aberto: dentro de um imóvel nenhum aparece (a fila espera você sair) e quem vinha atrás de
// você fica do lado de fora; ao sair, eles voltam a aparecer. E no menu não ficam o sino de avisos nem o botão de conversa.
'use strict';
const { open } = require('./harness');
const wait = ms => new Promise(r => setTimeout(r, ms));
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    await page.evaluate(() => {
      P.god = true;
      const s = World.structs.find(x => x && !x.removed && x.type === 'tavern' && Places.def(x));
      P.x = (s.x + s.w / 2) * TILE; P.y = (s.y + s.h + 1) * TILE;
      Game.spawn('bandit', P.x + 200, P.y, { leash: 40, tag: 'assassin' }); // um já vinha atrás
      Places.enterRoom(s); G.assassins = 5;
    });
    await wait(12000);
    const inside = await page.evaluate(() => ({ place: !!G.place, n: G.ents.filter(e => !e.dead && e.tag === 'assassin').length, queue: G.assassins }));
    if (!inside.place) fails.push('o teste não conseguiu ficar dentro do imóvel');
    if (inside.n) fails.push(`${inside.n} assassino(s) dentro do imóvel`);
    if (inside.queue < 5) fails.push(`a fila de assassinos foi gasta lá dentro (${inside.queue})`);
    await page.evaluate(() => Places.exit(true));
    // cada segundo há 15% de chance de um surgir: espera até um aparecer (no máximo 45 s)
    let out = 0; for (let k = 0; k < 45 && !out; k++) { await wait(1000); out = await page.evaluate(() => G.ents.filter(e => !e.dead && e.tag === 'assassin').length); }
    if (!out) fails.push('fora do imóvel os assassinos não voltaram a aparecer');
    await page.evaluate(() => { UIP.bell(); const b = document.getElementById('alertBell'); if (b) b.classList.remove('hidden'); UI.talkEl.style.display = 'flex'; Game.toMenu(); });
    await wait(500);
    const menu = await page.evaluate(() => { const b = document.getElementById('alertBell'); return { bell: !!b && getComputedStyle(b).display !== 'none', talk: getComputedStyle(UI.talkEl).display !== 'none' }; });
    if (menu.bell) fails.push('o sino de avisos aparece no menu');
    if (menu.talk) fails.push('o botão "Conversar" aparece no menu');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
