// Haras: dar nome e personalizar o cavalo (pelagem, crina, manta, meias e estrela, que aparecem no mundo), os desenhos
// de verdade nas janelas, o cruzamento em cartões, o histórico de corridas de cada cavalo e as abas cabendo na janela
// (no computador e no celular).
'use strict';
const { open } = require('./harness');
const check = async (W, H, fails, tag) => {
  const { page, errors, close } = await open({ width: W, height: H });
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; Dialog.confirm = (o, y) => y && y(); P.gold = 9000;
      const sp = (k, dx) => { const s = freeSpotNear(P.x + dx, P.y + 120, 200); World.addStruct(k, Math.floor(s.x / TILE), Math.floor(s.y / TILE), BUILDINGS[k].w, BUILDINGS[k].h, 'player'); };
      sp('haras', 0); sp('stable', 160);
      P.horse = Horses.make('puro', { name: 'Relâmpago', sex: 'm' }); Horses.herd().push(Horses.make('arabe', { sex: 'f' }), Horses.make('percherao', { sex: 'm' }));
      const fits = name => { const pr = UI.panel.getBoundingClientRect(); const out = [...UI.panel.querySelectorAll('.hs-pg2 .card, .hs-pre > *, .hs-tabs')].filter(e => { const q = e.getBoundingClientRect(); return q.height && (q.bottom > pr.bottom + 1 || q.right > pr.right + 1); }); ok(!out.length, `${name}: passou da janela (${out.map(e => e.className.split(' ')[0]).join(', ')})`);
        const pb = UI.panel.querySelector('.pb'); ok(!pb || pb.scrollHeight <= pb.clientHeight + 2, `${name}: a janela rola (${pb && pb.scrollHeight}/${pb && pb.clientHeight})`); };
      const painted = () => { const c = UI.panel.querySelector('canvas.hs-cv'); if (!c) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 16) if (d[i]) return true; return false; };
      for (const t of ['cavalos', 'visual', 'cruzar', 'premio']) { UI.showHaras(t); fits(t); }
      UI.showHaras('cavalos'); ok(painted(), 'os cavalos não foram desenhados na janela');
      ok(UI.panel.querySelectorAll('.hs-tile').length >= 3, 'faltam os cartões dos cavalos');
      // personalizar o cavalo escolhido
      const h = Horses.herd()[0]; UI.act('hs', { op: 'sel', i: h.id, k: 'visual' }); ok(UI.sel.hsTab === 'visual' && Horses.sel() === h, 'não escolheu o cavalo para personalizar');
      UI.act('hs', { op: 'look', k: 'coat', v: '#24201e' }); UI.act('hs', { op: 'look', k: 'mane', v: '#e8d08a' }); UI.act('hs', { op: 'look', k: 'blanket', v: '#24407a' });
      UI.act('hs', { op: 'look', k: 'socks' }); UI.act('hs', { op: 'look', k: 'blaze' });
      ok(h.color === '#24201e' && Horses.key(h) === '#24201e|#e8d08a|#24407a|sb', 'a aparência não foi guardada: ' + Horses.key(h));
      const inp = document.getElementById('hsName'); inp.value = 'Tempestade<b>'; UI.act('hs', { op: 'name', i: h.id }); ok(h.name === 'Tempestadeb', 'o nome não mudou: ' + h.name);
      ok(UI.panel.querySelector('.hs-sw.on') && painted(), 'a prévia não aparece');
      // aparece no mundo: montar o cavalo personalizado e desenhar
      UI.act('hs', { op: 'ride', i: h.id }); ok(P.horse === h, 'não montou o cavalo');
      let got = null; const dh = drawHorse; window.drawHorse = function (...a) { got = a[6]; return dh.apply(this, a); }; // eslint-disable-line
      try { UI.close(); P.mounted = true; Game.render(); } finally { window.drawHorse = dh; } // eslint-disable-line
      ok(got === Horses.key(h), 'o cavalo do mundo não usa a aparência escolhida: ' + got);
      // cruzamento pelos cartões
      const pr = Horses.pair(); UI.sel.hsTab = 'cruzar'; UI.act('hs', { op: 'pickM', i: pr.mares[0].id }); UI.act('hs', { op: 'pickS', i: pr.studs[0].id });
      UI.act('hs', { op: 'breed2', m: pr.mares[0].id, s: pr.studs[0].id }); ok(pr.mares[0].foal, 'o cruzamento não aconteceu');
      // corrida: o histórico do cavalo
      Horses.S().race = null; Horses.race(); ok((P.horse.races || 0) === 1, 'a corrida não entrou no histórico do cavalo');
      return bad;
    });
    fails.push(...r.map(x => `${tag}: ${x}`));
  } finally { await close(); }
  fails.push(...errors.map(e => `${tag}: erro no jogo: ${e}`));
};
module.exports = async () => { const fails = []; await check(1366, 720, fails, 'pc'); await check(844, 390, fails, 'celular'); return fails; };
