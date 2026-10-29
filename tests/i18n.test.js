// Nome do jogo, botão de idioma no menu (com bandeira), tela de criar sem o texto da dificuldade
// e o jogo inteiro em outro idioma (inglês) sem erro.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const fails = [];
  // português (o original): nome novo, três idiomas na lista, sem o texto embaixo da dificuldade
  {
    const { page, errors, close } = await open({ newGame: false });
    try {
      const r = await page.evaluate(() => {
        Menu.act('langMenu', {});
        const list = [...document.querySelectorAll('#langList button')];
        Menu.act('create', {});
        return { sub: document.querySelector('.menu-title h4').textContent, title: document.title, n: list.length, flags: list.filter(b => b.querySelector('svg.lang-flag')).length,
          names: list.map(b => b.textContent.trim()), diff: !!document.querySelector('.cr-diff, #diffNote'), btns: document.querySelectorAll('[data-k="diff"]').length };
      });
      if (r.sub !== 'O Último Reino') fails.push(`o subtítulo do menu é "${r.sub}"`);
      if (!/O Último Reino/.test(r.title)) fails.push(`o título da página é "${r.title}"`);
      if (r.n !== 3 || r.flags !== 3) fails.push(`o botão de idioma tem ${r.n} idiomas e ${r.flags} bandeiras`);
      if (r.names.join() !== 'Português,English,Español') fails.push('nomes dos idiomas: ' + r.names.join());
      if (r.diff) fails.push('o texto embaixo dos botões de dificuldade ainda aparece');
      if (r.btns !== 3) fails.push('faltam os botões de dificuldade');
      fails.push(...errors.map(e => 'erro no jogo (pt): ' + e));
    } finally { await close(); }
  }
  // inglês: menu, criação, jogo e janelas traduzidos
  {
    const { page, errors, close } = await open({ query: '?lang=en' });
    try {
      const r = await page.evaluate(() => {
        const out = {};
        out.inv = (UI.showInventory(), document.getElementById('panel').innerText);
        UI.showKingdom && UI.showKingdom(); out.k = document.getElementById('panel').innerText;
        out.t = I18N.t('Novo jogo'); out.tpl = I18N.t('Você tem 5 moedas');
        return out;
      });
      if (!/Backpack|BACKPACK/i.test(r.inv)) fails.push('a mochila não ficou em inglês');
      if (r.t !== 'New game') fails.push(`"Novo jogo" virou "${r.t}"`);
      const pt = (r.inv + r.k).match(/\b(Você|não|está|também|vila|moedas)\b/g);
      if (pt && pt.length > 3) fails.push('ainda há português nas janelas em inglês: ' + pt.slice(0, 6).join(', '));
      fails.push(...errors.map(e => 'erro no jogo (en): ' + e));
    } finally { await close(); }
  }
  return fails;
};
