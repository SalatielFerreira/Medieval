'use strict';
// Portfólio mais enxuto: saem do menu Família, Estações e clima e Reino (o atlas).
//  • A Família (membros da Casa e o casamento dos filhos) vai para Linhagens; Fora da lei e Mercenários viram a janela
//    Serviços. Os seus reinos, as suas vilas, Coroa e títulos, as Finanças, a Sociedade e os Tratados estão no Reinado
//    (reinado.js, que também cuida dos atalhos antigos deles).
//  • Haras e corridas sai: tudo é feito na construção Haras (o cruzamento e o Grande Prêmio, lá dentro).
//  • Estações e clima e o atlas dos reinos saem de vez.
//  • Os atalhos antigos (Avisos, Grandes Casas, botões) abrem o lugar novo.
const PF_GONE = { family: 'tree', 'x:clima': 'overview', atlas: 'overview', 'x:merc': 'x:outlaw', 'x:horses': 'overview' };
// Serviços: Fora da lei e Mercenários numa janela só, uma página para cada
const OL_TABS = [['bando', '🗡️', 'Fora da lei', 'x:outlaw'], ['merc', '⚔️', 'Mercenários', 'x:merc']];

const Portfolio = {
  // a página antiga, sem o cabeçalho dela, com um título de seção no lugar
  part(kp, nav, ic, title) {
    const h = kp(nav) || '';
    return `<div class="card pf-part"><div class="sec">${ic} ${title}</div></div>` + h.replace(/^\s*<div class="pg-head">[\s\S]*?<\/div><\/div>/, '');
  },
  // páginas dentro da página: se os quadros não cabem, eles se dividem em páginas (◀ 1/2 ▶), sem cortar nenhum
  paginate() {
    this.pageAdv();
    const box = UI.panel && UI.panel.querySelector('.kpg .cr-page.cr-soc'); if (!box) return;
    const S = UI.sel, key = box.classList.contains('cr-vil') ? 'vilas' : 'soc:' + (S.socTab || 'rep'); // (Reinado → Títulos e corte)
    UI.pageList({ items: [...box.querySelectorAll(':scope > .soc > .card, :scope > .card')], over: () => box.scrollHeight > box.clientHeight + 1, key, store: S.crPg = S.crPg || {}, act: 'crpg',
      host: box.querySelector(':scope > .soc > .tabs') || box.querySelector('.tabs') || UI.panel.querySelector('.cr-tabs') });
  },
  // muitos títulos: as vantagens se dividem em páginas dentro do quadro da nobreza
  pageAdv() {
    const adv = UI.panel && UI.panel.querySelector('.kpg .cr-tit .cr-adv'); if (!adv) return;
    const box = adv.closest('.card'), S = UI.sel;
    UI.pageList({ items: [...adv.querySelectorAll('.cr-adv-t')], over: () => box.scrollHeight > box.clientHeight + 1, key: 'adv', store: S.crPg = S.crPg || {}, act: 'crpg', host: adv.querySelector('.cr-next-h') });
  },
  outlaw(kp0) {
    const tab = OL_TABS.find(t => t[0] === UI.sel.olTab) || OL_TABS[0];
    const tabs = `<div class="tabs subtabs ol-tabs">${OL_TABS.map(([k, ic, l]) => `<button class="tab ${tab[0] === k ? 'on' : ''}" data-act="oltab" data-t="${k}">${ic} ${l}</button>`).join('')}</div>`;
    return UI.pageHead('🗡️', 'Serviços', 'O bando, os golpes e a recompensa pela sua cabeça · companhias livres para a guerra e para golpes')
      + tabs + (kp0(tab[3]) || '').replace(/^\s*<div class="pg-head">[^]*?<\/div><\/div>/, '');
  },
  target(nav) { return PF_GONE[nav]; },
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
    if (this.sel.knav === 'x:merc') this.sel.olTab = 'merc'; // os Mercenários são uma página de Fora da lei
    if (PF_GONE[this.sel.knav]) this.sel.knav = Portfolio.target(this.sel.knav);
    return sk0(...a);
  };
  const ac0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'oltab') { this.sel.olTab = d.t; this.sel.knav = 'x:outlaw'; this.showKingdom(); return; }
    if (a === 'crtab') { Reinado.go('t', d.t); return; } // as páginas de Títulos e corte, no Reinado
    if (a === 'crpg') { const P0 = this.sel.crPg || (this.sel.crPg = {}); P0[d.k] = Math.max(0, (P0[d.k] || 0) + +d.d); this.showKingdom(); return; }
    return ac0(a, d);
  };
  // o conteúdo que mudou de lugar
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    if (PF_GONE[nav]) nav = Portfolio.target(nav);
    if (nav === 'x:outlaw') return Portfolio.outlaw(kp0);
    const h = kp0(nav);
    if (nav === 'tree') return h + Portfolio.part(kp0, 'family', '👪', 'A sua Casa: membros e casamento dos filhos');
    return h;
  };
}
