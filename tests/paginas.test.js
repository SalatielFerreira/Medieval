// Portfólio em menos páginas: percorre TODO o menu do Portfólio e TODAS as abas e sub-abas (clicando os botões de aba),
// no computador (1366×720) e no celular deitado (844×390), com o herói rei de um reino e governador de uma vila de outro,
// três empreendimentos e o jogo avançado seis meses. Falha se alguma aba:
//  • rolar (a janela inteira rola em vez de caber ou virar páginas);
//  • tiver uma página cortada (o conteúdo passa do fim da página) ou um quadro que rola por dentro;
//  • tiver uma página vazia (só o cabeçalho) ou meio vazia antes de outra (menos de 35% ocupada);
//  • passar do limite de páginas da tabela LIMITES (abaixo).
// Páginas = as páginas lado a lado do paginador (UI.fitReino, ‹ 1/2 ›); as partes ◀ 1/2 ▶ das listas que crescem com o
// jogo (UI.pageList: ranking, negócios, registros, meses, avisos...) não contam, porque crescem de propósito.
'use strict';
const { open } = require('./harness');

// limites de páginas por aba: [computador, celular]; a chave é o começo do rótulo "<menu> | <abas abertas>"
// (o primeiro que casar vale; "*" é o padrão). Os do celular são folgados para as listas de um jogo de alguns meses.
const LIMITES = [
  ['x:reign | k:1/leis', [3, 10]], ['x:reign | k:1/tesouro', [1, 5]], ['x:reign | k:1/conselho', [1, 5]], ['x:reign | k:1/diplo', [1, 5]],
  ['x:reign | k:1/brasao', [1, 5]], ['x:reign | k:1/obras', [1, 4]], ['x:reign | k:1/corte', [1, 4]], ['x:reign | k:1', [1, 3]],
  ['x:reign | v:', [3, 8]], ['x:reign | t/titulos', [1, 6]], ['x:reign | t', [1, 4]],
  ['families | ranking', [1, 16]], ['families | reinos', [1, 8]], ['families | inquietas', [1, 8]],
  ['biz | painel', [1, 7]], ['biz | nb_biz', [1, 5]], ['biz | nb_contracts', [1, 6]], ['biz | rival', [1, 8]], ['biz', [1, 5]],
  ['x:painel | meses', [1, 6]], ['x:painel', [1, 4]], ['x:ordens | sociedades', [1, 5]], ['x:games', [1, 4]],
  ['*', [1, 4]],
];
const limit = (label, cel) => (LIMITES.find(([k]) => k === '*' || label.startsWith(k)) || LIMITES[LIMITES.length - 1])[1][cel ? 1 : 0];

// a medição da página aberta (roda no navegador)
function measure() {
  const body = UI.panel.querySelector('.snav-body'), pages = [...body.querySelectorAll('.kpages > .kpg')], br = body.getBoundingClientRect();
  const out = { n: pages.length || 1, bad: [] };
  if (!pages.length && body.scrollHeight > body.clientHeight + 2) out.bad.push('a janela rola');
  const vis = el => el.offsetParent !== null && !el.closest('[hidden]');
  const name = c => (typeof c.className === 'string' ? c.className : c.tagName).split(' ').slice(0, 2).join('.');
  (pages.length ? pages : [body]).forEach((p, i) => {
    const pr = p.getBoundingClientRect(), bottom = Math.min(pr.bottom, br.bottom);
    if (pages.length && p.scrollHeight > p.clientHeight + 4) out.bad.push(`página ${i + 1} cortada (${p.scrollHeight - p.clientHeight}px)`);
    let maxB = pr.top;
    for (const c of p.querySelectorAll('*')) {
      if (!vis(c)) continue;
      const cr = c.getBoundingClientRect(); if (!cr.height) continue;
      if (c.matches('.card') && cr.bottom > bottom + 4) out.bad.push(`quadro ${name(c)} cortado na página ${i + 1}`);
      const ov = getComputedStyle(c).overflowY;
      if ((ov === 'auto' || ov === 'scroll') && c.scrollHeight > c.clientHeight + 4 && !c.matches('.tabs, .rn-rbtns')) out.bad.push(`${name(c)} rola por dentro (página ${i + 1})`);
      if (cr.bottom > maxB && cr.bottom <= bottom + 4) maxB = cr.bottom;
    }
    if (pages.length) {
      if (![...p.children].some(e => !e.matches('.pg-head, .tabs, .subtabs, .ktabs, .rg-top, .rn-roles'))) out.bad.push(`página ${i + 1} vazia`);
      else if (i < pages.length - 1 && (maxB - pr.top) / pr.height < 0.35) out.bad.push(`página ${i + 1} meio vazia antes de outra`);
    }
  });
  out.bad = [...new Set(out.bad)].slice(0, 4);
  return out;
}

async function run(width, height) {
  const { page, errors, close } = await open({ width, height }), fails = [], cel = width < 1000, tag = cel ? 'celular' : 'computador';
  try {
    await page.evaluate(() => {
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000; P.level = 20; UI.showWarCouncil = () => {};
      // três empreendimentos com funcionários
      const v0 = World.villages[0];
      const free = (x, y, w, h) => World.areaOk(x, y, w, h) && World.areaFree(x, y, w, h) && [...Array(w)].every((_, i) => [...Array(h)].every((__, j) => !World.obj[World.idx(x + i, y + j)]));
      const build = k => { const b = BUILDINGS[k]; for (let r = 0; r < 120; r++) for (let a = 0; a < 48; a++) { const x = Math.round(v0.x + Math.cos(a / 48 * 6.28) * (14 + r)), y = Math.round(v0.y + Math.sin(a / 48 * 6.28) * (14 + r)); if (free(x - 1, y - 1, b.w + 2, b.h + 2)) return World.addStruct(k, x, y, b.w, b.h, 'player', { built: true }); } return null; };
      for (const k of ['biz_mill', 'biz_farm', 'biz_bakery']) { const s = build(k); if (s) for (const c of Biz.candidates(s).slice(0, 2)) { c.p.aff = 40; Biz.hire(c.p, s); } }
      // rei do reino 1 e governador de uma vila do reino 3
      Chiefdom.grant(World.villages.findIndex(v => v && !v.free && v.civ === 3 && !v.ruin), 'teste');
      G.titles = { 1: 0, 2: 2 }; Court.syncPrincipal();
      Game.becomeRuler(1, 'teste');
    });
    for (let m = 0; m < 6; m++) await page.evaluate(() => {
      Perf.live = true; Game.onNewDay(); Perf.live = false;
      let g = 0; while (Perf.queue.length && g++ < 3000) Perf.update(0.016);
      if (G.civs[1].ruler !== 'player') Game.becomeRuler(1, 'teste');
      G.civs[1].treasury = Math.max(G.civs[1].treasury, 5000); G.civs[1].happy = Math.max(G.civs[1].happy, 60);
    });
    await page.evaluate(() => { UI.close(); UI.sel.knav = 'overview'; UI.showKingdom(); });
    const menu = await page.evaluate(() => [...UI.panel.querySelectorAll('.snav .snav-i')].map(e => e.dataset.k));
    for (const k of ['overview', 'biz', 'families', 'tree', 'x:painel', 'x:ordens', 'x:outlaw', 'x:games', 'x:reign']) if (!menu.includes(k)) fails.push(`${tag}: o menu do Portfólio não tem ${k}`);
    let seenTabs = 0;
    for (const nav of menu) {
      await page.evaluate(nav => { UI.sel.kpageOf = {}; UI.sel.knav = nav; UI.showKingdom(); window.__sel0 = JSON.stringify(UI.sel); }, nav);
      const seen = new Set(), labels = new Set();
      // cada estado = o caminho de cliques desde o item do menu (refeito a cada visita, com UI.sel do começo)
      const visit = async (path, depth) => {
        await page.evaluate((nav, path) => {
          const o = JSON.parse(window.__sel0); for (const k of Object.keys(UI.sel)) delete UI.sel[k]; Object.assign(UI.sel, o);
          UI.sel.kpageOf = {}; UI.sel.knav = nav; UI.showKingdom(); for (const d of path) { UI.sel.kpageOf = {}; UI.act(d.act, d); }
        }, nav, path);
        await page.evaluate(() => document.fonts.ready.then(() => new Promise(r => setTimeout(r, 30)))); // (a fonte dos títulos muda as alturas)
        if (!await page.evaluate(() => UI.cur && UI.cur.fn === 'showKingdom')) return;
        const on = await page.evaluate(() => [...new Set([...UI.panel.querySelectorAll('.snav-body .tabs button.tab.on, .snav-body .rn-role.on')].map(b => b.dataset.k || b.dataset.t || b.textContent.trim().slice(0, 14)))].join('/'));
        const label = nav + (on ? ' | ' + on : '');
        if (labels.has(label)) return; labels.add(label); seenTabs++;
        const m = await page.evaluate(measure);
        for (const b of m.bad) fails.push(`${tag}: ${label}: ${b}`);
        if (m.n > limit(label, cel)) fails.push(`${tag}: ${label}: ${m.n} páginas (limite ${limit(label, cel)})`);
        if (depth > 5) return;
        const btns = await page.evaluate(() => [...new Map([...UI.panel.querySelectorAll('.snav-body .tabs button.tab:not(.on):not([disabled]), .snav-body .rn-role:not(.on)')].map(b => [JSON.stringify(b.dataset), Object.assign({}, b.dataset)])).values()]);
        for (const d of btns) { const key = JSON.stringify(d); if (seen.has(key)) continue; seen.add(key); await visit(path.concat([d]), depth + 1); }
      };
      await visit([], 0);
    }
    if (seenTabs < 40) fails.push(`${tag}: só ${seenTabs} abas percorridas (esperava 40 ou mais)`);
    console.log(`    ${tag}: ${seenTabs} abas percorridas`);
  } finally { await close(); }
  return fails.concat(errors.map(e => `erro no jogo (${tag}): ${e}`));
}

module.exports = async () => (await run(1366, 720)).concat(await run(844, 390));
