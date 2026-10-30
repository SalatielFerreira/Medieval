// 36 meses de vida: o Pregoeiro junta notícias de todas as seções, os moradores sobem na vida, a página de notícias e a
// conversa mostram a vida das pessoas, os balões aparecem sem erro e as notícias continuam depois de salvar e carregar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(async () => {
      P.god = true;
      for (let k = 0; k < 36; k++) { Game.econTick(); if (k % 12 === 11) People.tickYear(); await new Promise(r => setTimeout(r, 20)); }
      const L = News.L(), cats = {};
      for (const n of L) cats[n.cat] = (cats[n.cat] || 0) + 1;
      const risen = G.people.filter(p => p.alive && (p.gentry || p._opened || (p.fame || 0) > 0)).length;
      const marked = G.people.filter(p => p.alive && News.status(p)).length;
      UI.sel.dtab = 'news'; UI.showDiary();
      const items = document.querySelectorAll('.nw-item').length, head = !!document.querySelector('.nw-top');
      UI.sel.ncat = 'life'; (UI.sel.svSub = UI.sel.svSub || {}).dynews = 'todas'; UI.showDiary();
      const lifeOnly = [...document.querySelectorAll('.nw-item')].every(el => el.dataset.cat === 'life');
      UI.close();
      // conversa com alguém que tem notícias
      const who = G.people.find(p => p.alive && !p.kin && News.of(p).length);
      UI.sel.tktab = 'ficha'; UI.sel.tkfor = who && who.id;
      if (who) UI.showTalk(who.id);
      const life = !!document.querySelector('.pf');
      UI.close();
      // balões: desenha os moradores perto do herói
      const v = World.villages[0]; P.x = v.x * TILE; P.y = v.y * TILE;
      await new Promise(r => setTimeout(r, 1500));
      return { total: L.length, cats, risen, marked, items, head, lifeOnly, who: !!who, life };
    });
    if (a.total < 10) fails.push(`só ${a.total} notícias em 36 meses`);
    if (Object.keys(a.cats).length < 3) fails.push(`notícias de poucas seções: ${JSON.stringify(a.cats)}`);
    if (!a.items || !a.head) fails.push('a página do Pregoeiro não mostrou as notícias');
    if (!a.lifeOnly) fails.push('o filtro "Gente" mostrou notícias de outras seções');
    if (a.who && !a.life) fails.push('a conversa não mostrou a vida da pessoa');
    if (!a.marked) fails.push('nenhum morador com balão');
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const n = await page.evaluate(() => News.L().length);
    if (n !== a.total) fails.push(`notícias depois de carregar: ${n} (eram ${a.total})`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
