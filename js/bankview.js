'use strict';
// A janela do banco em tela cheia, arrumada: as abas numa coluna à esquerda (cada uma com o resumo do que tem: o saldo,
// os títulos, as dívidas...), no alto a página com os números que importam, e os cartões lado a lado. Cada página
// cabe na janela sem rolar: lista comprida vira páginas dentro do próprio cartão (‹ 1/3 ›) e, se ainda faltar
// espaço, tudo fica um pouco mais compacto.
if (!WIDE_PANELS.includes('showBank')) WIDE_PANELS.push('showBank');
const BankView = {
  scene: WIN_SCENES.showBank,
  pg: {},  // página de cada lista (por aba)
  DESC: {
    conta: 'Guarde e saque: rende todo mês e fica a salvo de ladrões e cobradores.',
    prazo: 'Títulos do Tesouro: o reino devolve com juros no vencimento.',
    credito: 'Dinheiro hoje, parcelas todo mês. Atrasar custa caro.',
    emprestar: 'Empreste às famílias e aos vizinhos e receba com juros.',
    investir: 'Ponha dinheiro nos negócios das famílias e nas vilas.',
    bolsa: 'Ações das cinco companhias: preço que sobe e desce, e dividendos.',
    renda: 'Fundo das Guildas, renda vitalícia e o seguro das expedições.',
    expedicoes: 'Caravanas e navios: quanto mais longe, mais rende e mais arrisca.',
    cofre: 'O seu cofre particular: o que vale muito, guardado em segurança.',
    tesouro: 'As contas do reino: reserva, dívida, juros e o livro do banco.',
  },
  sub(k, ci) {
    try {
      const B = Bank.B(), X = typeof Bolsa !== 'undefined' ? Bolsa.X() : null, n = (a, s, p) => `${a} ${a === 1 ? s : p}`;
      switch (k) {
        case 'conta': return `${Bank.acc(ci).toLocaleString('pt-BR')} 🪙`;
        case 'prazo': { const t = B.terms.filter(x => x.ci === ci); return t.length ? n(t.length, 'título', 'títulos') : 'nenhum título'; }
        case 'credito': { const L = Loans.L(); return L.length ? `${L.reduce((a, l) => a + l.left, 0)} 🪙 a pagar` : 'sem dívidas'; }
        case 'emprestar': return 'famílias e reinos';
        case 'investir': return 'negócios e vilas';
        case 'bolsa': return X ? `${Bolsa.value().toLocaleString('pt-BR')} 🪙 em ações` : '';
        case 'renda': return X ? (X.rendas.length ? `${X.rendas.reduce((a, r) => a + r.m, 0)} 🪙/mês` : `fundo ${Math.round(X.fund)} 🪙`) : '';
        case 'expedicoes': return `${B.exp.length}/4 na estrada`;
        case 'cofre': { const b = Bank.box(ci), q = Object.values(b).reduce((a, x) => a + x, 0); return q ? n(q, 'item guardado', 'itens guardados') : 'vazio'; }
        case 'tesouro': return Bank.health(ci).level;
      }
    } catch (e) { /* resumo opcional */ }
    return '';
  },
  // monta a janela nova a partir do que a janela antiga desenhou
  build(body, ci, tab) {
    const box = document.createElement('div'); box.innerHTML = body;
    const scn = box.querySelector('.scn'); if (scn) scn.remove();
    const w = box.querySelector('.bankw'); if (!w) return null;
    const tabs = w.querySelector(':scope > .tabs'); if (tabs) tabs.remove();
    // os cartões soltos (os que vinham agrupados em duas colunas também)
    for (const g of [...w.querySelectorAll(':scope > .kgrid')]) { while (g.firstChild) g.parentNode.insertBefore(g.firstChild, g); g.remove(); }
    const rail = BANK_TABS.map(([k, l]) => {
      const m = l.match(/^(\S+)\s+(.*)$/) || [0, '🏦', l];
      return `<button class="bk3-tab ${k === tab ? 'on' : ''}" data-act="bank" data-c="${ci}" data-t="${k}"><span class="bk3-ti">${m[1]}</span><span class="bk3-tl"><b>${m[2]}</b><small>${UI.esc(this.sub(k, ci))}</small></span></button>`;
    }).join('');
    const cur = BANK_TABS.find(t => t[0] === tab) || BANK_TABS[0], cm = cur[1].match(/^(\S+)\s+(.*)$/) || [0, '🏦', cur[1]];
    let sc = null; try { sc = this.scene(ci); } catch (e) { /* sem resumo */ }
    const chips = sc && sc.chips ? sc.chips.map(c => `<span class="bk3-chip ${c[2] || ''}">${c[0]} ${c[1]}</span>`).join('') : '';
    const K = Bank.K(ci), H = Bank.health(ci);
    return `<div class="bk3 bankw-v lv-${String(H.level).replace(/\W+/g, '')}">
      <aside class="bk3-rail"><div class="bk3-id"><span class="bk3-seal">🏦</span><span><b>${UI.esc(K.name)}</b><small>${UI.esc(CIV_DEFS[ci].name)} · ${UI.esc(H.level)}</small></span></div>
        <nav class="bk3-tabs">${rail}</nav><div class="bk3-purse"><small>No bolso</small><b>${P.gold.toLocaleString('pt-BR')} 🪙</b></div></aside>
      <section class="bk3-main"><header class="bk3-top"><span class="bk3-pi">${cm[1]}</span><span class="bk3-pt"><b>${cm[2]}</b><small>${this.DESC[tab] || ''}</small></span><span class="bk3-chips">${chips}</span></header>
        <div class="bk3-body" data-tab="${tab}">${w.innerHTML}</div></section></div>`;
  },
  // cada página cabe na janela: listas compridas viram páginas dentro do cartão
  fit(tab) {
    const el = UI.panel.querySelector('.bk3-body'); if (!el) return;
    el.classList.remove('tight', 'scroll');
    if (document.body.classList.contains('small')) el.classList.add('tight'); // no celular já começa compacto (mais linhas por página)
    for (const b of el.querySelectorAll('.bk3-pager')) b.remove();
    const over = () => el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2;
    const ROW = '.crow, .bank-log, .bank-it, .bx-row, .nb-card';
    for (const c of el.children) if (c.classList.contains('card')) c.classList.toggle('narrow', c.clientWidth < 560);
    const lists = [];
    for (const card of el.querySelectorAll('.card')) {
      const groups = new Map();
      for (const r of card.querySelectorAll(ROW)) { r.hidden = false; if (r.parentElement.closest(ROW)) continue; const p = r.parentElement; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(r); }
      for (const [p, rows] of groups) if (rows.length > 2) lists.push({ p, rows, per: rows.length, key: tab + ':' + lists.length });
    }
    const show = L => {
      const pages = Math.ceil(L.rows.length / L.per), pg = Math.min(this.pg[L.key] || 0, pages - 1); this.pg[L.key] = pg;
      L.rows.forEach((r, i) => { r.hidden = Math.floor(i / L.per) !== pg; });
      let bar = L.bar;
      if (pages > 1 && !bar) {
        bar = L.bar = document.createElement('div'); bar.className = 'bk3-pager';
        bar.innerHTML = '<button data-d="-1" aria-label="Página anterior">‹</button><span></span><button data-d="1" aria-label="Próxima página">›</button>';
        bar.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation(); const n = Math.ceil(L.rows.length / L.per); this.pg[L.key] = ((this.pg[L.key] || 0) + +b.dataset.d + n) % n; show(L); });
        const last = L.rows[L.rows.length - 1];
        last.insertAdjacentElement('afterend', bar);
      }
      if (bar) { bar.hidden = pages <= 1; bar.querySelector('span').textContent = `${pg + 1} / ${pages}`; }
    };
    lists.forEach(show);
    for (let guard = 0; over() && guard < 300; guard++) {
      // só encolhe as listas dos cartões que passam do fim da página (os outros ficam inteiros)
      const bottom = el.getBoundingClientRect().bottom + 1, cand = lists.filter(x => x.per > 1), out = cand.filter(x => x.p.closest('.card').getBoundingClientRect().bottom > bottom);
      const L = (out.length ? out : cand).sort((a, b) => b.per * (b.rows[0].offsetHeight || 30) - a.per * (a.rows[0].offsetHeight || 30))[0];
      if (!L) break;
      L.per--; show(L);
    }
    if (over()) el.classList.add('tight');
    // ainda não cabe: os cartões se dividem em telas (‹ 1/2 › no canto de baixo)
    const main = el.parentElement, old = main.querySelector('.bk3-cpager'); if (old) old.remove();
    const cards = [...el.children];
    for (const c of cards) c.hidden = false;
    if (over() && cards.length > 1) {
      const pages = [[]];
      for (const c of cards) c.hidden = true;
      for (const c of cards) {
        const cur = pages[pages.length - 1]; c.hidden = false;
        if (over() && cur.length) { for (const x of cur) x.hidden = true; pages.push([c]); } else cur.push(c);
      }
      const key = tab + ':cards', n = pages.length;
      const showP = () => { const pg = Math.min(this.pg[key] || 0, n - 1); this.pg[key] = pg; pages.forEach((P0, i) => P0.forEach(c => { c.hidden = i !== pg; })); bar.querySelector('span').textContent = `${pg + 1} / ${n}`; };
      const bar = document.createElement('div'); bar.className = 'bk3-cpager';
      bar.innerHTML = '<button data-d="-1" aria-label="Tela anterior">‹</button><span></span><button data-d="1" aria-label="Próxima tela">›</button>';
      bar.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation(); this.pg[key] = ((this.pg[key] || 0) + +b.dataset.d + n) % n; showP(); });
      main.appendChild(bar); showP();
    }
    if (over()) el.classList.add('scroll');
  },
};

{
  delete WIN_SCENES.showBank; // o resumo vai para o alto da página (mais compacto)
  const sb0 = UI.showBank.bind(UI);
  UI.showBank = function (ci, tab, robbing) {
    const op = this.open; let got = null;
    this.open = (title, body, fn, args, sub) => { got = { title, body, fn, args, sub }; };
    try { sb0(ci, tab, robbing); } finally { this.open = op; }
    if (!got) return;
    const t = (got.args && got.args[1]) || tab || 'conta';
    let html = null; try { html = BankView.build(got.body, ci, t); } catch (e) { console.error(e); }
    this.open(got.title, html || got.body, got.fn, got.args, got.sub);
    if (html) { BankView.fit(t); requestAnimationFrame(() => { if (UI.cur && UI.cur.fn === 'showBank') BankView.fit(t); }); }
  };
  // a janela muda de tamanho: refaz as páginas
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (UI.cur && UI.cur.fn === 'showBank' && !UI.panel.classList.contains('hidden')) BankView.fit(UI.cur.args[1] || 'conta'); }, 150); });
}
