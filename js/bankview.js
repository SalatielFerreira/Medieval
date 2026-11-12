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
    conta: 'O seu dinheiro pessoal: rende 0,5% ao mês, pago pelo banco, sem mexer no tesouro do reino.',
    prazo: 'Títulos do Tesouro: o reino devolve com juros no vencimento.',
    credito: 'Dinheiro hoje, parcelas todo mês. Atrasar custa caro.',
    emprestar: 'Empreste às famílias e aos vizinhos e receba com juros.',
    investir: 'Ponha dinheiro nos negócios das famílias e nas vilas.',
    bolsa: 'Ações das companhias: preço que sobe e desce, dividendos todo mês e a sua carteira.',
    renda: 'Fundo das Guildas, renda vitalícia e o seguro das expedições.',
    expedicoes: 'Caravanas e navios: quanto mais longe, mais rende e mais arrisca.',
    cofre: 'O seu cofre particular: o que vale muito, guardado em segurança.',
    tesouro: 'O dinheiro do reino (não o seu): tesouro, reserva do banco, dívida, juros do povo e o livro do banco.',
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
        case 'expedicoes': return `${B.exp.length}/${typeof BANK_EXP_MAX !== 'undefined' ? BANK_EXP_MAX : 4} na estrada`;
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
    const hasAmt = this.compact(w);
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
      <section class="bk3-main"><header class="bk3-top"><span class="bk3-pi">${cm[1]}</span><span class="bk3-pt"><b>${cm[2]}</b><small>${this.DESC[tab] || ''}</small></span><span class="bk3-chips">${chips}</span>${hasAmt ? `<span class="bk3-amtsel" title="O valor que os botões das linhas usam"><small>Valor</small>${this.AMTS.map(a => `<button type="button" data-amt="${a}" class="${a === this.amt ? 'on' : ''}">${a.toLocaleString('pt-BR')}</button>`).join('')}</span>` : ''}</header>
        <div class="bk3-body" data-tab="${tab}">${w.innerHTML}</div></section></div>`;
  },
  // ---- um valor só para a página: as fileiras de botões (+1 +100 +500 +1000 +5000) viram um botão por linha
  AMTS: [100, 500, 1000, 5000], amt: 500,
  VERB: { dep: 'Depositar', wd: 'Sacar', apply: 'Aplicar', inv: 'Investir', fin: 'Pôr', fout: 'Tirar', rin: 'Pôr', rout: 'Tirar', exp: 'Enviar', borrow: 'Pegar', repay: 'Pagar' },
  SKIP: new Set(['rate', 'buy', 'sell', 'buyv', 'loan', 'lend']),
  compact(root) {
    let any = false;
    for (const row of root.querySelectorAll('.act-row')) {
      const groups = new Map();
      for (const b of row.querySelectorAll('button')) {
        const key = b.dataset.n !== undefined && /^-?\d+(\.\d+)?$/.test(b.dataset.n) ? 'n' : b.dataset.k !== undefined && /^\d+$/.test(b.dataset.k) ? 'k' : null;
        if (!key || this.SKIP.has(b.dataset.op)) continue;
        const g = (b.dataset.act || '') + '/' + (b.dataset.op || '') + '/' + (b.dataset.i || '') + '/' + (b.dataset.kk || '');
        if (!groups.has(g)) groups.set(g, []); groups.get(g).push({ b, key, v: +b.dataset[key] });
      }
      for (const list of groups.values()) {
        if (list.length < 3) continue;
        const map = {}; for (const x of list) map[x.v] = !x.b.disabled;
        const first = list[0].b, nb = first.cloneNode(false), label = first.textContent.trim();
        const verb = this.VERB[first.dataset.op] || (/^[−-]/.test(label) ? 'Tirar' : 'Pôr');
        nb.className = (first.className + ' bk3-amt').trim(); nb.dataset.amtmap = JSON.stringify(map); nb.dataset.amtkey = list[0].key; nb.dataset.verb = verb; nb.removeAttribute('disabled');
        first.before(nb); for (const x of list) x.b.remove(); any = true;
      }
    }
    this.applyAmt(root);
    return any;
  },
  applyAmt(root) {
    for (const b of root.querySelectorAll('.bk3-amt')) {
      let map = {}; try { map = JSON.parse(b.dataset.amtmap); } catch (e) { /* sem mapa */ }
      const vals = Object.keys(map).map(Number).sort((a, c) => a - c); if (!vals.length) continue;
      const v = vals.includes(this.amt) ? this.amt : (vals.filter(x => x <= this.amt).pop() || vals[0]);
      b.dataset[b.dataset.amtkey] = String(v); b.disabled = !map[v];
      b.innerHTML = `${b.dataset.verb} <b>${v.toLocaleString('pt-BR')}</b>`;
    }
  },
  scr: {}, // rolagem de cada lista (volta ao lugar depois de comprar, depositar...)
  // cada página cabe na janela sem rolar: as listas compridas rolam dentro do próprio cartão
  fit(tab) {
    const el = UI.panel.querySelector('.bk3-body'); if (!el) return;
    el.classList.remove('tight', 'scroll', 'stretch');
    if (document.body.classList.contains('small')) el.classList.add('tight'); // no celular já começa compacto
    const over = () => el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2;
    const ROW = '.crow, .bank-log, .bank-it, .bx-row, .nb-card';
    for (const c of el.children) if (c.classList.contains('card')) { c.classList.toggle('narrow', c.clientWidth < 560); c.style.maxHeight = el.clientHeight + 'px'; c.classList.add('bk3-capped'); } // nenhum cartão passa da altura da página (rola por dentro)
    // as linhas de cada cartão ficam numa caixa que pode rolar
    const lists = [];
    for (const card of el.querySelectorAll(':scope > .card')) {
      const groups = new Map();
      for (const r of card.querySelectorAll(ROW)) { if (r.parentElement.closest(ROW)) continue; const p = r.parentElement; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(r); }
      for (const [p, rows] of groups) {
        if (rows.length < 3) continue;
        let box = p;
        if (p === card || [...p.children].some(k => !rows.includes(k))) { box = document.createElement('div'); rows[0].before(box); for (const r of rows) box.appendChild(r); }
        box.classList.add('bk3-list'); const key = tab + ':' + lists.length; box.dataset.lkey = key; lists.push(box);
        box.addEventListener('scroll', () => { this.scr[key] = box.scrollTop; }, { passive: true });
      }
    }
    // poucos cartões (cabem numa fileira): viram colunas da altura da página
    const cols = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
    const span = c => { const cs = getComputedStyle(c); if (cs.gridColumnEnd === '-1') return cols; return /span 2/.test(cs.gridColumnStart + cs.gridColumnEnd) ? Math.min(2, cols) : 1; };
    const used = [...el.children].reduce((a, c) => a + span(c), 0);
    if (used <= cols) el.classList.add('stretch');
    else {
      // vários cartões: a lista do cartão que passa do fim da página encolhe e rola
      for (let guard = 0; over() && guard < 12; guard++) {
        const bottom = el.getBoundingClientRect().bottom;
        let changed = false;
        for (const L of lists) {
          const card = L.closest('.card'), extra = card.getBoundingClientRect().bottom - bottom;
          if (extra <= 1) continue;
          const h = Math.max(70, L.clientHeight - extra - 4); if (h >= L.clientHeight) continue;
          L.style.maxHeight = h + 'px'; changed = true;
        }
        if (!changed) break;
      }
    }
    for (const L of lists) if (this.scr[L.dataset.lkey]) L.scrollTop = this.scr[L.dataset.lkey];
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
    if (html) {
      const sel = UI.panel.querySelector('.bk3-amtsel');
      if (sel) sel.addEventListener('click', ev => { const b = ev.target.closest('button[data-amt]'); if (!b) return; ev.stopPropagation(); BankView.amt = +b.dataset.amt; for (const x of sel.querySelectorAll('button')) x.classList.toggle('on', x === b); BankView.applyAmt(UI.panel); });
      BankView.fit(t); requestAnimationFrame(() => { if (UI.cur && UI.cur.fn === 'showBank') BankView.fit(t); }); }
  };
  // a janela muda de tamanho: refaz as páginas
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (UI.cur && UI.cur.fn === 'showBank' && !UI.panel.classList.contains('hidden')) BankView.fit(UI.cur.args[1] || 'conta'); }, 150); });
}
