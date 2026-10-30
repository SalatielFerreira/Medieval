'use strict';
// Portfólio mais enxuto: saem do menu Família, Estações e clima, Reino (o atlas), Tratados e Sociedade.
//  • O que só existia nelas foi para outras janelas: a Sociedade (eleições, convites, rivais, reputação e segredos) vai
//    para o fim de Coroa e títulos; a Família (membros da Casa e o casamento dos filhos) vai para Linhagens; os Tratados
//    (casamento entre dinastias, comércio, tributo e reféns) vão para o Reinado (só o rei).
//  • Vilas e guardas vira uma página de Coroa e títulos; Fora da lei e Mercenários viram a janela Serviços.
//  • Haras e corridas sai: tudo é feito na construção Haras (o cruzamento e o Grande Prêmio, lá dentro).
//  • Estações e clima e o atlas dos reinos saem de vez.
//  • Os atalhos antigos (Avisos, Grandes Casas, botões) abrem o lugar novo.
const PF_GONE = { family: 'tree', 'x:society': 'crown', 'x:pacts': 'x:reign', 'x:clima': 'overview', atlas: 'overview', villages: 'crown', 'x:merc': 'x:outlaw', 'x:horses': 'overview' };
// páginas que viraram abas de Coroa e títulos
const PF_TAB = { 'x:society': 'sociedade', villages: 'vilas' };
// Serviços: Fora da lei e Mercenários numa janela só, uma página para cada
const OL_TABS = [['bando', '🗡️', 'Fora da lei', 'x:outlaw'], ['merc', '⚔️', 'Mercenários', 'x:merc']];

const Portfolio = {
  // a página antiga, sem o cabeçalho dela, com um título de seção no lugar
  part(kp, nav, ic, title) {
    const h = kp(nav) || '';
    return `<div class="card pf-part"><div class="sec">${ic} ${title}</div></div>` + h.replace(/^\s*<div class="pg-head">[\s\S]*?<\/div><\/div>/, '');
  },
  // Coroa e títulos em páginas (abas no alto), cada uma cabendo inteira na janela:
  //  ⚜️ Títulos (nobreza com as vantagens de cada título conquistado e o próximo · civil · deixar o poder), 👑 Corte e
  //  reinos (convite ou a sua corte · relação com os 7 reinos) e 🤝 Sociedade (reputação, amigos, eventos, política e
  //  segredos, em duas colunas) e 🏘️ Vilas e guardas (as suas vilas, guardas, ofícios vagos e fundar uma vila)
  CROWN_TABS: [['titulos', '⚜️', 'Títulos'], ['corte', '👑', 'Corte e reinos'], ['vilas', '🏘️', 'Vilas e guardas'], ['sociedade', '🤝', 'Sociedade']],
  crown(kp0) {
    const S = UI.sel, tab = this.CROWN_TABS.some(t => t[0] === S.crTab) ? S.crTab : 'titulos';
    const t = document.createElement('template'); t.innerHTML = kp0('crown');
    const pick = sel => { const e = t.content.querySelector(sel); return e ? e.outerHTML : ''; };
    const tabs = `<div class="tabs subtabs cr-tabs">${this.CROWN_TABS.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="crtab" data-t="${k}">${ic} ${l}</button>`).join('')}</div>`;
    let body;
    if (tab === 'titulos') {
      // o próximo título de nobreza e o que ele pede; como ganhar cada título civil
      const tp = t.content.querySelector('.tpair'), cards = tp ? tp.querySelectorAll(':scope > .card') : [];
      const T0 = Court.T(), nx = NOBLE_TITLES[Math.max(-1, T0.lvl) + 1], fem = P.sex === 'f', held = Court.titledCivs();
      // as vantagens aparecem conforme os títulos são conquistados (um por reino, cada um com as suas)
      if (held.length && cards[0]) { const tl = cards[0].querySelector('.tlist'); if (tl) tl.remove(); } // os nomes já estão nas vantagens
      if (cards[0] && held.length) cards[0].insertAdjacentHTML('beforeend', `<div class="cr-adv"><div class="cr-next-h">Suas vantagens</div>${held.map(ci => { const l = Court.levelIn(ci);
        return `<div class="cr-adv-t"><div class="cr-adv-h"><b>${NOBLE_TITLES[l].icon} ${UI.esc(Court.titleName(l, ci))}</b><button class="danger" data-act="nbLeaveT" data-c="${ci}">Renunciar</button></div><div class="cr-reqs">${Nobility.lines(l).map(x => `<span>${x}</span>`).join('')}</div></div>`; }).join('')}</div>`);
      if (cards[0]) cards[0].insertAdjacentHTML('beforeend', nx ? `<div class="cr-next"><div class="cr-next-h">Próximo: <b>${nx.icon} ${fem ? nx.f : nx.m}</b> <small>peça no castelo de um reino</small></div>
        <div class="cr-reqs"><span>🤝 relação com o reino <b>${nx.rel}+</b></span><span>📜 serviços à coroa <b>${nx.serv}+</b></span>
        <span class="${P.level >= nx.lvl ? 'ok' : ''}">⭐ nível <b>${nx.lvl}+</b> ${P.level >= nx.lvl ? '✓' : `(você: ${P.level})`}</span>${nx.fee ? `<span class="${P.gold >= nx.fee ? 'ok' : ''}">🪙 taxa <b>${nx.fee}</b></span>` : ''}</div>
        <small class="muted">${nx.perks}</small></div>` : '<div class="cr-next"><div class="cr-next-h">Você chegou ao título mais alto.</div></div>');
      if (cards[1]) cards[1].insertAdjacentHTML('beforeend', `<div class="cr-civ">${CIVIL_TITLES.map(ct => `<div class="${Court.hasCivil(ct.id) ? 'got' : ''}"><span>${ct.icon}</span><b>${Court.civilName(ct)}</b><small>${ct.req}</small><em>${Court.hasCivil(ct.id) ? '✓' : ''}</em></div>`).join('')}</div>`);
      // renunciar a um título fica junto das vantagens dele; em Deixar o poder sobram o trono e as vilas
      const lv = t.content.querySelector('.nb-leave');
      if (lv) lv.querySelectorAll('.nb-row').forEach(r => { if (r.querySelector('[data-act="nbLeaveT"]')) r.remove(); });
      body = `<div class="cr-page cr-tit">${tp ? tp.outerHTML : ''}${lv && lv.querySelector('.nb-row') ? lv.outerHTML : ''}</div>`;
    }
    else if (tab === 'vilas') body = `<div class="cr-page cr-soc cr-vil">${(kp0('villages') || '').replace(/^\s*<div class="pg-head">[^]*?<\/div><\/div>/, '')}</div>`;
    else if (tab === 'corte') body = `<div class="cr-page cr-2"><div class="cr-col">${pick('.court-inv')}</div><div class="cr-col">${pick('.rel-card')}</div></div>`;
    else body = `<div class="cr-page cr-soc">${(kp0('x:society') || '').replace(/^\s*<div class="pg-head">[^]*?<\/div><\/div>/, '')}</div>`;
    return pick('.pg-head') + tabs + body;
  },
  // páginas dentro da página: se os quadros não cabem, eles se dividem em páginas (◀ 1/2 ▶), sem cortar nenhum
  paginate() {
    this.pageAdv();
    const box = UI.panel && UI.panel.querySelector('.kpg .cr-page.cr-soc'); if (!box || document.body.classList.contains('small')) return;
    const cards = [...box.querySelectorAll(':scope > .soc > .card, :scope > .card')];
    if (box.scrollHeight <= box.clientHeight + 1 || cards.length < 2) return;
    const pages = []; let start = 0;
    while (start < cards.length) {
      cards.forEach(c => { c.hidden = true; });
      let end = start;
      for (let i = start; i < cards.length; i++) {
        cards[i].hidden = false;
        if (box.scrollHeight > box.clientHeight + 1 && i > start) { cards[i].hidden = true; break; }
        end = i + 1;
      }
      pages.push([start, end]); start = end;
    }
    const S = UI.sel, key = box.classList.contains('cr-vil') ? 'vilas' : 'soc:' + (S.socTab || 'rep'); S.crPg = S.crPg || {};
    const n = pages.length, k = Math.min(S.crPg[key] || 0, n - 1);
    cards.forEach((c, i) => { c.hidden = i < pages[k][0] || i >= pages[k][1]; });
    const tabs = box.querySelector(':scope > .soc > .tabs') || box.querySelector('.tabs') || UI.panel.querySelector('.cr-tabs');
    if (tabs) tabs.insertAdjacentHTML('beforeend', `<span class="cr-pager"><button data-act="crpg" data-k="${key}" data-d="-1" ${k ? '' : 'disabled'}>◀</button><b>${k + 1}/${n}</b><button data-act="crpg" data-k="${key}" data-d="1" ${k < n - 1 ? '' : 'disabled'}>▶</button></span>`);
  },
  // muitos títulos: as vantagens se dividem em páginas dentro do quadro da nobreza
  pageAdv() {
    const adv = UI.panel && UI.panel.querySelector('.kpg .cr-tit .cr-adv'); if (!adv || document.body.classList.contains('small')) return;
    const box = adv.closest('.card'), items = [...adv.querySelectorAll('.cr-adv-t')], over = () => box.scrollHeight > box.clientHeight + 1;
    if (!over() || items.length < 2) return;
    const pages = []; let start = 0;
    while (start < items.length) {
      items.forEach(c => { c.hidden = true; });
      let end = start;
      for (let i = start; i < items.length; i++) { items[i].hidden = false; if (over() && i > start) { items[i].hidden = true; break; } end = i + 1; }
      pages.push([start, end]); start = end;
    }
    const S = UI.sel; S.crPg = S.crPg || {};
    const n = pages.length, k = Math.min(S.crPg.adv || 0, n - 1);
    items.forEach((c, i) => { c.hidden = i < pages[k][0] || i >= pages[k][1]; });
    adv.querySelector('.cr-next-h').insertAdjacentHTML('beforeend', `<span class="cr-pager"><button data-act="crpg" data-k="adv" data-d="-1" ${k ? '' : 'disabled'}>◀</button><b>${k + 1}/${n}</b><button data-act="crpg" data-k="adv" data-d="1" ${k < n - 1 ? '' : 'disabled'}>▶</button></span>`);
  },
  outlaw(kp0) {
    const tab = OL_TABS.find(t => t[0] === UI.sel.olTab) || OL_TABS[0];
    const tabs = `<div class="tabs subtabs ol-tabs">${OL_TABS.map(([k, ic, l]) => `<button class="tab ${tab[0] === k ? 'on' : ''}" data-act="oltab" data-t="${k}">${ic} ${l}</button>`).join('')}</div>`;
    return UI.pageHead('🗡️', 'Serviços', 'O bando, os golpes e a recompensa pela sua cabeça · companhias livres para a guerra e para golpes')
      + tabs + (kp0(tab[3]) || '').replace(/^\s*<div class="pg-head">[^]*?<\/div><\/div>/, '');
  },
  target(nav) {
    const t = PF_GONE[nav];
    if (t === 'x:reign' && !G.civs.some(c => c.ruler === 'player')) return 'overview';
    return t;
  },
};

{
  // o menu do Portfólio não mostra mais as cinco
  const nh0 = UI.navHtml.bind(UI);
  // (filtra o menu pronto: o grupo Gestão é acrescentado por outro módulo, depois deste)
  UI.navHtml = function (groups, cur, act, body) {
    let h = nh0(groups, cur, act, body);
    if (act === 'knav') {
      for (const k of Object.keys(PF_GONE)) h = h.replace(new RegExp('<button class="snav-i[^"]*" data-act="knav" data-k="' + k + '">[^]*?</button>', 'g'), '');
      h = h.replace(/(data-k="x:outlaw">[^]*?)Fora da lei</, '$1Serviços<');
    }
    return h;
  };
  // quem ia para uma delas cai no lugar novo
  const sk0 = UI.showKingdom.bind(UI);
  UI.showKingdom = function (...a) {
    if (PF_TAB[this.sel.knav]) this.sel.crTab = PF_TAB[this.sel.knav]; // a Sociedade e as Vilas agora são páginas de Coroa e títulos
    if (this.sel.knav === 'x:merc') this.sel.olTab = 'merc'; // e os Mercenários, de Fora da lei
    if (PF_GONE[this.sel.knav]) this.sel.knav = Portfolio.target(this.sel.knav);
    const r = sk0(...a);
    if (this.sel.knav === 'crown') { try { Portfolio.paginate(); } catch (e) { console.error(e); } }
    return r;
  };
  const ac0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'oltab') { this.sel.olTab = d.t; this.sel.knav = 'x:outlaw'; this.showKingdom(); return; }
    if (a === 'crtab') { this.sel.crTab = d.t; this.sel.knav = 'crown'; this.showKingdom(); return; }
    if (a === 'crpg') { const P0 = this.sel.crPg || (this.sel.crPg = {}); P0[d.k] = Math.max(0, (P0[d.k] || 0) + +d.d); this.showKingdom(); return; }
    return ac0(a, d);
  };
  // o conteúdo que mudou de lugar
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    if (PF_GONE[nav]) nav = Portfolio.target(nav);
    if (nav === 'crown') return Portfolio.crown(kp0);
    if (nav === 'x:outlaw') return Portfolio.outlaw(kp0);
    const h = kp0(nav);
    if (nav === 'tree') return h + Portfolio.part(kp0, 'family', '👪', 'A sua Casa: membros e casamento dos filhos');
    if (nav === 'x:reign' && G.civs.some(c => c.ruler === 'player')) return h + Portfolio.part(kp0, 'x:pacts', '📜', 'Tratados: casamento entre dinastias, comércio, tributos e reféns');
    return h;
  };
}
