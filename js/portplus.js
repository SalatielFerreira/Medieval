'use strict';
// O porto numa página só, sem cortar nada: no alto, o porto (mestre, bolsa do porto, o seu ouro e o navio); embaixo,
// três colunas — 🐟 Vender ao porto (tudo do mar que está na mochila), 🛒 Mercado do mar (comprar peixes, frutos do mar
// e produtos do mar, em abas) e ⛵ o navio, o equipamento e o contrabando (em abas). Lista que não cabe vira partes
// ◀ 1/2 ▶ (sem rolar). O mestre do porto compra e vende tudo o que vem do mar.
const PORT_MARKET = {
  peixes: ['🐟', 'Peixes', ['sardine', 'trout', 'carp', 'cod', 'octopus', 'goldfish']],
  frutos: ['🦐', 'Frutos do mar', ['mussels', 'shrimp', 'crab', 'oyster', 'squid', 'lobster']],
  produtos: ['🧂', 'Do mar', ['seaweed', 'seashell', 'salted_fish', 'smoked_fish', 'fish_oil', 'cooked_fish', 'grilled_shrimp', 'grilled_trout', 'fish_pie', 'seafood_stew', 'pearl']],
};
const PORT_BUY_MUL = 1.3; // o porto vende 30% acima do que paga

const PortPlus = {
  market(cat) { return (PORT_MARKET[cat] || PORT_MARKET.peixes)[2].filter(k => ITEMS[k]); },
  // tudo o que o porto compra: os peixes de sempre, o mercado do mar e o que vem do alto-mar
  buys() { return [...new Set([...PORT_BUYS, ...Object.values(PORT_MARKET).flatMap(m => m[2]), 'shark', 'whale'])].filter(k => ITEMS[k]); },
  buyPrice(k) { return Math.max(2, Math.ceil(ITEMS[k].price * PORT_BUY_MUL)); },
  sellPrice(k) { return Ports.price(k); },
  buy(sid, k, n) {
    const s = World.structs[sid], st = Ports.state(s), pr = this.buyPrice(k);
    n = Math.min(n, Math.floor(P.gold / pr)); if (n <= 0) { UI.msg(`${ITEMS[k].name} custa ${pr} Salin.`, 'bad'); return; }
    P.gold -= n * pr; st.purse += n * pr; Inv.add(k, n); Sound.play('coin');
    UI.msg(`⚓ Comprou ${n}× ${ITEMS[k].name} por ${n * pr} Salin.`, 'gold');
  },
  // a janela
  html(s) {
    const sid = s.id, st = Ports.state(s), esc = UI.esc.bind(UI), S = UI.sel, ci = s.owner;
    const name = s.village !== undefined && World.villages[s.village] ? World.villages[s.village].name : CIV_DEFS[ci] ? CIV_DEFS[ci].short : 'mar aberto';
    const kp = Ports.keeper(s), sh = typeof Sea !== 'undefined' ? Sea.ship() : null;
    const chip = (ic, l, v) => `<span class="pt2-chip"><i>${ic}</i><small>${l}</small><b>${v}</b></span>`;
    const top = `<div class="pt2-top"><span class="pt2-anchor">⚓</span><span class="pt2-name"><b>Porto de ${esc(name)}</b><small>${kp ? `${esc(People.full(kp))} · ${People.title(kp)} · cuida do porto` : 'Sem mestre do porto agora'}</small></span>
      ${kp ? `<button class="pt2-talk" data-act="tk" data-op="open" data-id="${kp.id}">💬 Conversar</button>` : ''}
      ${chip('💰', 'Bolsa do porto', st.purse.toLocaleString('pt-BR'))}${chip('🪙', 'Você', P.gold.toLocaleString('pt-BR'))}${sh ? chip(SHIPS[sh.kind].icon, esc(sh.name), `casco ${sh.hull}/${SHIPS[sh.kind].hull}`) : chip('⛵', 'Navio', 'nenhum')}</div>`;
    // 1. vender
    const big = ['whale', 'shark', 'octopus', 'lobster', 'pearl'];
    const mine = this.buys().filter(k => Inv.count(k) > 0).sort((a, b) => this.sellPrice(b) - this.sellPrice(a));
    const sellRows = mine.map(k => { const pr = this.sellPrice(k), n = Inv.count(k);
      return `<div class="pt2-row ${big.includes(k) ? 'big' : ''}"><span class="pt2-ic">${UI.ii(k)}</span><span class="pt2-t"><b>${esc(ITEMS[k].name)}</b><small>você tem ${n} · ${pr} cada</small></span>
        <span class="pt2-a"><button data-act="portsell" data-s="${sid}" data-k="${k}" data-n="1" ${st.purse >= pr ? '' : 'disabled'}>1</button><button class="primary" data-act="portsell" data-s="${sid}" data-k="${k}" data-n="${n}" ${st.purse >= pr ? '' : 'disabled'}>Todos · ${(n * pr).toLocaleString('pt-BR')}</button></span></div>`; }).join('');
    const sell = `<div class="card pt2-col"><div class="sec">🐟 Vender ao porto <span>${mine.length ? mine.length + ' tipo(s)' : ''}</span></div>
      ${sellRows ? `<div class="pt2-list" data-pg="sell">${sellRows}</div>` : '<div class="pt2-none">🎣<small>Nada do mar na mochila. Pesque em rios e no mar; de barco, em alto-mar vivem tubarões, polvos e baleias.</small></div>'}</div>`;
    // 2. comprar
    const cat = PORT_MARKET[S.ptCat] ? S.ptCat : 'peixes';
    const tabs = Object.entries(PORT_MARKET).map(([k, m]) => `<button class="tab ${k === cat ? 'on' : ''}" data-act="ptCat" data-k="${k}" data-s="${sid}">${m[0]} ${m[1]}</button>`).join('');
    const buyRows = this.market(cat).map(k => { const pr = this.buyPrice(k), it = ITEMS[k];
      return `<div class="pt2-row"><span class="pt2-ic">${UI.ii(k)}</span><span class="pt2-t"><b>${esc(it.name)}</b><small>${pr} Salin${it.food ? ` · +${it.food} fome` : ''}${it.heal ? ` · +${it.heal} vida` : ''}</small></span>
        <span class="pt2-a"><button data-act="ptBuy" data-s="${sid}" data-k="${k}" data-n="1" ${P.gold >= pr ? '' : 'disabled'}>1</button><button data-act="ptBuy" data-s="${sid}" data-k="${k}" data-n="5" ${P.gold >= pr * 5 ? '' : 'disabled'}>5 · ${pr * 5}</button></span></div>`; }).join('');
    const buy = `<div class="card pt2-col"><div class="sec">🛒 Mercado do mar</div><div class="tabs subtabs pt2-tabs">${tabs}</div><div class="pt2-list" data-pg="buy-${cat}">${buyRows}</div></div>`;
    // 3. navio, equipamento e contrabando
    const parts = [];
    if (typeof Sea !== 'undefined') {
      const d = document.createElement('div'); d.innerHTML = Sea.portHtml(s);
      for (const c of d.querySelectorAll(':scope > .card')) {
        const t = c.classList.contains('sea-trade') ? ['porao', '📦 Porão'] : c.classList.contains('sea-go') ? ['zarpar', '🧭 Zarpar'] : ['navio', '⛵ Estaleiro'];
        parts.push([t[0], t[1], c.innerHTML.replace(/^<div class="sec">[\s\S]*?<\/div>/, '')]);
      }
    }
    parts.push(['equip', '🛶 Equipamento', PORT_SELLS.map(([k, p]) => `<div class="pt2-row"><span class="pt2-ic">${UI.ii(k)}</span><span class="pt2-t"><b>${esc(ITEMS[k].name)}</b><small>${p} Salin</small></span><span class="pt2-a"><button data-act="portbuy" data-s="${sid}" data-k="${k}" data-p="${p}" ${P.gold >= p ? '' : 'disabled'}>Comprar</button></span></div>`).join('')
      + `<div class="pt2-sea">${['whale', 'shark', 'octopus'].map(k => `<span>${ITEMS[k].icon}<b>${ITEMS[k].name.split(' (')[0]}</b><small>${Ports.price(k)} Salin</small></span>`).join('')}</div><small class="muted">Em alto-mar, longe da costa, vivem tubarões, polvos e, raramente, baleias.</small>`]);
    if (typeof LawsPlus !== 'undefined') { const lx = LawsPlus.portHtml(s); if (lx) { const d = document.createElement('div'); d.innerHTML = lx; const c = d.querySelector('.card'); if (c) parts.push(['smug', '🤫 Contrabando', c.innerHTML]); } }
    const pt = parts.find(p => p[0] === S.ptSide) || parts[0];
    const side = `<div class="card pt2-col pt2-side"><div class="tabs subtabs pt2-tabs">${parts.map(p => `<button class="tab ${p === pt ? 'on' : ''}" data-act="ptSide" data-k="${p[0]}" data-s="${sid}">${p[1]}</button>`).join('')}</div><div class="pt2-pane pt2-list" data-pg="side-${pt[0]}">${pt[2]}</div></div>`;
    return `<div class="pt2" data-pt2>${top}<div class="pt2-grid">${sell}${buy}${side}</div></div>`;
  },
  // lista que não cabe na coluna: partes ◀ 1/2 ▶ (o que não está na parte some; nada é cortado)
  paginate() {
    const P0 = UI.sel.ptPg || (UI.sel.ptPg = {});
    for (const L of UI.panel.querySelectorAll('.pt2-list')) {
      let items = [...L.children]; const key = L.dataset.pg;
      // o porão é uma tabela: as fileiras são as partes
      const tb = L.querySelector('table'); let rows = null;
      if (tb && items.length <= 3) { rows = [...tb.querySelectorAll('tr')].slice(1); }
      // um bloco só com vários botões (os destinos de Zarpar): os botões são as partes
      else if (items.length === 1 && items[0].children.length >= 2) rows = [...items[0].children];
      const list = rows || items, over = () => L.scrollHeight > L.clientHeight + 1;
      if (!over() || list.length < 2) continue;
      // a seta das partes entra antes da conta (ela muda a altura do título): no título da coluna ou, na coluna do
      // navio, numa linha logo abaixo das abas
      const col = L.closest('.pt2-col'); let host = col && col.querySelector(':scope > .sec');
      if (col && !host) { host = document.createElement('div'); host.className = 'pt2-pgline'; L.before(host); }
      const pg = document.createElement('span'); pg.className = 'cr-pager pt2-pager'; if (host) host.appendChild(pg);
      pg.innerHTML = `<button data-act="ptPg" data-k="${key}" data-d="-1">◀</button><b>1/9</b><button data-act="ptPg" data-k="${key}" data-d="1">▶</button>`;
      const pages = []; let start = 0;
      while (start < list.length) {
        list.forEach(c => { c.hidden = true; });
        let end = start;
        for (let i = start; i < list.length; i++) { list[i].hidden = false; if (over() && i > start) { list[i].hidden = true; break; } end = i + 1; }
        pages.push([start, end]); start = end;
      }
      const k = Math.min(P0[key] || 0, pages.length - 1);
      list.forEach((c, i) => { c.hidden = i < pages[k][0] || i >= pages[k][1]; });
      pg.innerHTML = `<button data-act="ptPg" data-k="${key}" data-d="-1" ${k ? '' : 'disabled'}>◀</button><b>${k + 1}/${pages.length}</b><button data-act="ptPg" data-k="${key}" data-d="1" ${k < pages.length - 1 ? '' : 'disabled'}>▶</button>`;
    }
  },
};

{
  UI.showPort = function (sid) {
    const s = World.structs[sid]; if (!s) return;
    this.open('Porto', PortPlus.html(s), 'showPort', [sid], 'Peixes, frutos do mar, navios e viagens');
    // as partes são contadas depois que a janela termina de se ajustar à tela
    try { PortPlus.paginate(); } catch (e) { console.error(e); }
    requestAnimationFrame(() => { if (UI.cur && UI.cur.fn === 'showPort' && UI.cur.args[0] === sid) { UI.panel.querySelectorAll('.pt2-pager, .pt2-pgline').forEach(x => x.remove()); UI.panel.querySelectorAll('.pt2-list [hidden], .pt2-list tr[hidden]').forEach(x => { x.hidden = false; }); try { PortPlus.paginate(); } catch (e) { console.error(e); } } });
  };
  // o que o porto compra: tudo do mar
  const pr0 = Ports.price.bind(Ports);
  Ports.price = function (k) { return ITEMS[k] ? pr0(k) : 1; };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'ptBuy') { PortPlus.buy(+d.s, d.k, +d.n); UI.showPort(+d.s); return; }
    if (a === 'ptCat') { UI.sel.ptCat = d.k; UI.showPort(+d.s); return; }
    if (a === 'ptSide') { UI.sel.ptSide = d.k; UI.showPort(+d.s); return; }
    if (a === 'ptPg') { const P0 = UI.sel.ptPg || (UI.sel.ptPg = {}); P0[d.k] = Math.max(0, (P0[d.k] || 0) + +d.d); if (UI.cur && UI.cur.fn === 'showPort') UI.showPort(UI.cur.args[0]); return; }
    return a0(a, d);
  };
}
