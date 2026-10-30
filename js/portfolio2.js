'use strict';
// Negócios (dentro de Empreendimentos, entre Seus empreendimentos e Contas) e Grandes Casas (Portfólio) redesenhados: cabem na janela sem rolar (páginas no alto e o que não couber vira
// partes ◀ 1/2 ▶, com Services.subs/paginate), mais organizados e bonitos. Os botões e as ações são os mesmos de antes.
//  📊 Negócios: 🏭 os negócios em cartões (lucro do mês, quanto já devolveu, estado, funcionários, insumos, seguro e
//     sócio) · 📜 Encomendas (em andamento × pedidos abertos) · 🎪 Feiras e leilões · 📒 Ocorrências (linha do tempo).
//  🏛️ Grandes Casas: 🏆 Pódio (a sua casa e as três maiores) · 📜 Ranking (todas, com influência, riqueza, gente e
//     lealdade) · 🗺️ Por reino (as maiores casas de cada reino) · ⚠️ Inquietas (lealdade baixa e revoltas).
const NegBoard = {
  esc(s) { return UI.esc(s); },
  money(n) { return (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('pt-BR'); },
  bar(v, cls) { return `<i class="nb-bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></i>`; },
  root(tab, tabs, body) {
    return `<div class="sv-root" data-g="bb" data-t="${tab}"><div class="tabs subtabs sv-sub">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="bboard" data-t="${k}">${l}</button>`).join('')}</div><div class="sv-pg">${body}</div></div>`;
  },
  card(s) {
    const esc = this.esc.bind(this), m = this.money.bind(this);
    const e = Biz.earn(s), val = Commerce.value(s), roi = val ? Math.round((e.paid || 0) / val * 100) : 0, ws = Biz.workers(s), cond = Commerce.cond(s), d = BIZ_TYPES[s.type];
    const sup = Commerce.supply(s, Math.max(1, ws.length)), lack = sup ? Object.entries(sup).filter(([, x]) => x.have < x.need) : [];
    const last = e.last ? e.last.rev - e.last.wages : 0, p = s.partner && G.people[s.partner.pid], strike = s.strike > G.day;
    const ins = BIZ_INPUTS[s.type] ? (lack.length ? `<span class="bad">📦 compra no mercado: ${lack.map(([k, x]) => `${ITEMS[k].name} (${x.price} 🪙)`).join(', ')}</span>` : '<span class="ok">📦 insumos abastecidos</span>') : '<span>📦 não usa insumos</span>';
    return `<div class="nb-card ${strike ? 'strike' : ''} ${last < 0 ? 'loss' : ''}"><div class="nb-ch"><span class="nb-ic">${Game.buildIcon(s.type)}</span><b>${esc(BUILDINGS[s.type].name)}</b><em class="${last >= 0 ? 'ok' : 'bad'}">${last >= 0 ? '+' : ''}${m(last)} 🪙/mês</em></div>
      ${strike ? '<div class="nb-warn">✊ Em greve: negocie com os grevistas</div>' : ''}
      <div class="nb-st"><span>💰 Devolveu <b>${roi}%</b>${this.bar(roi, 'roi')}</span><span>🏚️ Estado <b class="${cond < 60 ? 'bad' : ''}">${cond}%</b>${this.bar(cond, cond < 60 ? 'low' : 'cond')}</span>
        <span>👷 Funcionários <b>${ws.length}/${d ? d.slots : ws.length}</b><small>${ws.length ? ws.map(w => esc(w.name)).join(', ') : 'ninguém'}</small></span></div>
      <div class="nb-tags">${ins}<span>${s.insured ? `🛡️ segurado (${Commerce.premium(s)} 🪙/mês)` : '🛡️ sem seguro'}</span><span>${p ? `🤝 sócio: ${esc(p.name)} (30%)` : '🤝 sem sócio'}</span></div>
      <div class="nb-acts">${cond < 100 ? `<button data-act="bbrepair" data-s="${s.id}">🔧 Consertar ${Commerce.repairCost(s)} 🪙</button>` : ''}<button data-act="bbins" data-s="${s.id}">${s.insured ? 'Cancelar seguro' : '🛡️ Segurar'}</button>
        ${BIZ_INPUTS[s.type] ? `<button data-act="bbfeed" data-s="${s.id}">📦 Entregar insumos</button>` : ''}${strike ? `<button class="primary" data-act="bbsettle" data-s="${s.id}">🤝 Negociar</button>` : ''}
        ${p ? `<button data-act="bbbuyout" data-s="${s.id}">Comprar a parte do sócio ${m(val * 0.5)} 🪙</button>` : Commerce.partnerCands(s).slice(0, 1).map(c => `<button data-act="bbpartner" data-s="${s.id}" data-p="${c.id}">🤝 Sócio: ${esc(c.name)} +${m(val * 0.4)} 🪙</button>`).join('')}</div></div>`;
  },
  parts(tab) {
    const S = Commerce.st(), L = Biz.list(), esc = this.esc.bind(this), m = this.money.bind(this);
    const mine = Commerce.mine(), offers = Commerce.offers(), f = Commerce.fair(), a = Commerce.auction();
    const tabs = [['biz', `🏭 Negócios (${L.length})`], ['contracts', `📜 Encomendas${mine.length ? ` (${mine.length})` : ''}`], ['market', `🎪 Feiras e leilões${f || a ? ' •' : ''}`], ['log', '📒 Ocorrências']];
    let body;
    if (tab === 'biz') {
      const t = Biz.totals();
      body = `<div class="sv-strip"><span>📈 Último mês <b class="${t.lastProfit >= 0 ? '' : 'bad'}">${m(t.lastProfit)} 🪙</b></span><span>🏦 Desde o início <b>${m(t.profit)} 🪙</b></span><span>🏭 <b>${L.length}</b> ${L.length === 1 ? 'negócio' : 'negócios'}</span><span>✊ <b>${L.filter(s => s.strike > G.day).length}</b> em greve</span><span class="muted">Mais números no Painel e em Contas.</span></div>
        ${L.length ? `<div class="nb-grid sv-pl">${L.map(s => this.card(s)).join('')}</div>` : '<div class="sv-none">🏭<small>Você ainda não tem empreendimentos. Construa um em Construção → Empreendimentos.</small></div>'}`;
    } else if (tab === 'contracts') {
      const row = (k, btn) => { const have = Inv.count(k.item), left = k.due - G.day;
        return `<div class="nb-k"><span class="nb-ki">${UI.ii(k.item)}</span><span><b>${k.n} × ${esc(ITEMS[k.item].name)}</b><small>${esc(k.from)}</small><small class="${left <= 1 ? 'bad' : ''}">⏳ até ${Calendar.short(k.due)} · você tem ${have}${have >= k.n ? ' ✓' : ''}</small></span><em>${m(k.reward)} 🪙</em>${btn}</div>`; };
      body = `<div class="nb-k2"><div class="card"><div class="sec">📦 Em andamento <span>${mine.length}/4</span></div>${mine.map(k => row(k, `<button class="primary" data-act="bbdeliver" data-k="${k.id}" ${Inv.count(k.item) >= k.n ? '' : ''}>Entregar</button>`)).join('') || '<div class="sv-none">📦<small>Nenhuma encomenda aceita.</small></div>'}</div>
        <div class="card"><div class="sec">📜 Pedidos abertos <span>${offers.length}</span></div><div class="sv-pl">${offers.map(k => row(k, `<button data-act="bbtake" data-k="${k.id}" ${mine.length >= 4 ? 'disabled' : ''}>Aceitar</button>`)).join('')}</div>${offers.length ? '' : '<div class="sv-none">📜<small>Nenhum pedido agora: volte no mês que vem.</small></div>'}</div></div>
        <small class="muted">A entrega sai da mochila e, se faltar, do estoque dos seus negócios. Atrasar custa relação e fama.</small>`;
    } else if (tab === 'market') {
      const bid = a ? Math.round(Math.max(a.price, a.top || 0) * 1.1) : 0;
      body = `<div class="nb-mk"><div class="nb-mc fair ${f ? 'on' : ''}"><span class="nb-mi">🎪</span><small>Feira</small>${f ? `<h3>${esc(f.name)}</h3><p>em ${CIV_DEFS[f.ci].name} até ${Calendar.short(f.until)}</p><div class="nb-mt"><span>💰 venda +20%</span><span>🛒 compra −10%</span><span>🏭 negócios do reino +15%</span></div>` : '<h3>Nenhuma feira agora</h3><p>Elas acontecem nas viradas de estação, cada vez num reino.</p>'}</div>
        <div class="nb-mc auc ${a ? 'on' : ''}"><span class="nb-mi">🔨</span><small>Leilão</small>${a ? `<h3>${UI.ii(a.item)} ${esc(ITEMS[a.item].name)}</h3><p>no castelo de ${CIV_DEFS[a.ci].short} · fecha em ${Calendar.short(a.until)}</p><div class="nb-mt"><span>lance atual <b>${m(Math.max(a.price, a.top || 0))} 🪙</b></span>${a.mine ? `<span>seu lance <b>${m(a.mine)} 🪙</b></span>` : ''}</div><button class="primary" data-act="bbbid" data-c="${a.ci}" ${P.gold >= bid ? '' : 'disabled'}>Dar lance — ${m(bid)} 🪙</button>` : '<h3>Nenhum leilão agora</h3><p>Os castelos leiloam peças raras de tempos em tempos.</p>'}</div>
        <div class="nb-mc"><span class="nb-mi">📈</span><small>Oferta e procura</small><h3>Os preços se mexem</h3><p>Vender muito do mesmo item num reino derruba o preço lá por alguns meses; comprar muito, sobe. Reinos ricos pagam mais por luxo, e cada cultura tem os seus gostos (veja o castelo de cada reino).</p></div></div>`;
    } else {
      body = S.log.length ? `<div class="card nb-log"><div class="sec">📒 Ocorrências dos seus negócios <span>${S.log.length}</span></div><div class="sv-tl sv-pl">${S.log.map(x => `<div><em>${Calendar.short(x.d)}</em><span>${esc(x.t)}</span></div>`).join('')}</div></div>`
        : '<div class="sv-none">📒<small>Nada ainda: greves, roubos, incêndios, sócios e encomendas aparecem aqui.</small></div>';
    }
    return { tabs, body };
  },
  html(tab) { const x = this.parts(tab); return this.root(tab, x.tabs, x.body); },
};

// 🌳 Linhagens em duas páginas: a árvore da casa (com a árvore da dinastia e o placar) e os laços com o mapa de relações
// (antes vinham todos juntos e não cabiam).
const Lines = {
  html(h) {
    const t = document.createElement('template'); t.innerHTML = h;
    const pick = sel => { const e = t.content.querySelector(sel); return e ? e.outerHTML : ''; };
    const btns = t.content.querySelector('.lg-open');
    const list = [
      ['arvore', '🌳', 'Árvore da casa', `${btns ? `<div class="ln2-bar"><span>A sua dinastia, geração por geração.</span>${btns.innerHTML}</div>` : ''}<div class="ln2-one">${pick('.ln-tree')}</div>`],
      ['lacos', '🤝', 'Laços e relações', `<div class="ln2-two">${pick('.ln-ties')}${pick('.ln-map')}</div>`],
    ];
    return UI.pageHead('🌳', 'Linhagens', 'A sua dinastia e os laços entre as casas') + Services.subs('ln', list);
  },
};

const Houses = {
  esc(s) { return UI.esc(s); },
  crest(f, sz) { return `<span class="gc-crest" style="--c:${f.color};--s:${sz}px">${this.esc((f.surname || '?')[0])}</span>`; },
  civ(f) { return f.civ >= 0 && CIV_DEFS[f.civ] ? CIV_DEFS[f.civ].short : 'sem reino'; },
  open(f) { return `data-act="${f.player ? 'knav' : 'famview'}" data-k="family" data-f="${f.id}"`; },
  html() {
    const S = UI.sel, tabs = [['podio', '🏆', 'Pódio'], ['ranking', '📜', 'Ranking'], ['reinos', '🗺️', 'Por reino'], ['inquietas', '⚠️', 'Inquietas']];
    const all = Families.ranking(), total = G.people.filter(p => p.alive).length, esc = this.esc.bind(this);
    const mi = all.findIndex(x => x.f.player), me = all[mi], revolts = all.filter(x => Families.activeRevoltOf(x.f));
    const maxInf = Math.max(1, ...all.map(x => x.inf));
    const list = [];
    // 🏆 pódio
    const pod = [1, 0, 2].map(i => all[i]).map((x, k) => x ? `<button class="hs2-pod p${[2, 1, 3][k]}" ${this.open(x.f)}><span class="hs2-med">${['🥈', '🥇', '🥉'][k]}</span>${this.crest(x.f, [52, 64, 48][k])}<b>${esc(Families.name(x.f))}</b><small>${this.civ(x.f)}</small><em>⭐ ${x.inf}</em><i class="hs2-step"></i></button>` : '<span></span>').join('');
    list.push(['podio', '🏆', 'Pódio', `<div class="hs2-top"><div class="hs2-pods">${pod}</div>
      <div class="hs2-me">${me ? `${this.crest(me.f, 56)}<div><small>A sua casa</small><h3>${esc(Families.name(me.f))}</h3><b>${mi + 1}º <span>de ${all.length}</span></b><div class="hs2-chips"><span>⭐ ${me.inf} de influência</span><span>👥 ${Families.members(me.f).length} membros</span><span>💰 ${Math.round(me.f.wealth || 0).toLocaleString('pt-BR')} 🪙</span></div></div>` : '<div><h3>Sem casa</h3></div>'}</div></div>
      <div class="hs2-stats"><div><span>🏛️</span><b>${all.length}</b><small>casas</small></div><div><span>👥</span><b>${total}</b><small>pessoas vivas</small></div><div><span>👑</span><b>${all.filter(x => x.f.noble).length}</b><small>casas nobres</small></div><div class="${revolts.length ? 'bad' : ''}"><span>🔥</span><b>${revolts.length}</b><small>em revolta</small></div></div>`]);
    // 📜 ranking
    list.push(['ranking', '📜', 'Ranking', `<div class="hs2-head"><span>#</span><span>Casa</span><span>Influência</span><span>Riqueza</span><span>Gente</span><span>Lealdade</span></div><div class="hs2-rows sv-pl">${all.map((x, i) => { const l = Math.round(x.f.loyalty || 0);
      return `<button class="hs2-row ${x.f.player ? 'you' : ''} ${Families.activeRevoltOf(x.f) ? 'rev' : ''}" ${this.open(x.f)}><span class="hs2-n">${i + 1}º</span><span class="hs2-nm">${this.crest(x.f, 24)}<span><b>${esc(Families.name(x.f))}${x.f.noble ? ' 👑' : ''}</b><small>${this.civ(x.f)}</small></span></span>
        <span class="hs2-inf"><i style="width:${x.inf / maxInf * 100}%"></i><em>⭐ ${x.inf}</em></span><span>💰 ${Math.round(x.f.wealth || 0).toLocaleString('pt-BR')}</span><span>👥 ${Families.members(x.f).length}</span>
        <span class="hs2-loy"><i style="width:${x.f.player ? 100 : l}%;background:${l < 25 ? '#c0392b' : l < 45 ? '#d6a040' : '#6a9a4a'}"></i><em>${x.f.player ? '—' : l}</em></span></button>`; }).join('')}</div>`]);
    // 🗺️ por reino
    const civs = G.civs.filter(c => !c.dead);
    list.push(['reinos', '🗺️', 'Por reino', `<div class="hs2-civs sv-pl">${civs.map(c => { const fs = all.filter(x => x.f.civ === c.id);
      return `<div class="hs2-civ" style="--c:${Game.civColor(c.id)}"><div class="hs2-ch">${Heraldry.armsSvg(c.id, 26)}<b>${CIV_DEFS[c.id].short}</b><small>${fs.length} ${fs.length === 1 ? 'casa' : 'casas'}</small></div>
        ${fs.slice(0, 4).map((x, i) => `<button class="hs2-cr" ${this.open(x.f)}><em>${i + 1}</em>${this.crest(x.f, 20)}<b>${esc(Families.name(x.f))}${x.f.noble ? ' 👑' : ''}</b><small>⭐ ${x.inf}</small></button>`).join('') || '<small class="muted">Nenhuma casa.</small>'}</div>`; }).join('')}
      ${all.some(x => x.f.civ < 0) ? `<div class="hs2-civ" style="--c:#6a5a44"><div class="hs2-ch"><span>🏕️</span><b>Sem reino</b><small>${all.filter(x => x.f.civ < 0).length} casas</small></div>${all.filter(x => x.f.civ < 0).slice(0, 4).map((x, i) => `<button class="hs2-cr" ${this.open(x.f)}><em>${i + 1}</em>${this.crest(x.f, 20)}<b>${esc(Families.name(x.f))}</b><small>⭐ ${x.inf}</small></button>`).join('')}</div>` : ''}</div>`]);
    // ⚠️ inquietas
    const uneasy = all.filter(x => !x.f.player && !x.f.noble && (Families.activeRevoltOf(x.f) || (x.f.loyalty || 0) < 35)).sort((a, b) => (!!Families.activeRevoltOf(b.f) - !!Families.activeRevoltOf(a.f)) || a.f.loyalty - b.f.loyalty);
    list.push(['inquietas', '⚠️', `Inquietas${uneasy.length ? ` (${uneasy.length})` : ''}`, uneasy.length ? `<div class="hs2-un sv-pl">${uneasy.map(x => { const rv = Families.activeRevoltOf(x.f), l = Math.round(x.f.loyalty || 0);
      return `<button class="hs2-u ${rv ? 'rev' : ''}" ${this.open(x.f)}>${this.crest(x.f, 34)}<span><b>${esc(Families.name(x.f))}</b><small>${this.civ(x.f)} · 💰 ${Math.round(x.f.wealth || 0).toLocaleString('pt-BR')} · 👥 ${Families.members(x.f).length}</small>
        ${rv ? `<em class="bad">🔥 em revolta · força ${rv.str}</em>` : `<span class="hs2-loy"><i style="width:${l}%;background:${l < 25 ? '#c0392b' : '#d6a040'}"></i><em>lealdade ${l}</em></span>`}</span></button>`; }).join('')}</div><small class="muted">Casas ricas e com pouca lealdade podem declarar guerra à coroa.</small>`
      : '<div class="hs2-calm"><span>🕊️</span><b>Os reinos estão em paz</b><small>Nenhuma casa ameaça a coroa no momento.</small></div>']);
    if (!tabs.some(t => t[0] === (S.svSub || {}).gc)) (S.svSub || (S.svSub = {})).gc = 'podio';
    return Services.subs('gc', list);
  },
};

{
  // Negócios: a janela redesenhada (as ações e o lugar no Portfólio continuam os de antes)
  // (o Portfólio monta a página com a função "crua" guardada em UIP._raw.board)
  const raw = function (tab) {
    tab = tab || UI.sel.bbTab || 'biz'; if (!['biz', 'contracts', 'market', 'log'].includes(tab)) tab = 'biz'; UI.sel.bbTab = tab;
    UI.open('📊 Painel dos negócios', `<div class="bboard">${NegBoard.html(tab)}</div>`, 'showBizBoard', [tab], 'Seus negócios, encomendas, feiras e leilões');
  };
  if (typeof UIP !== 'undefined' && UIP._raw) UIP._raw.board = raw;
  // Negócios entra em Empreendimentos: as quatro páginas ficam entre Seus empreendimentos e Contas
  BizBoard.TABS.splice(2, 0, ['nb_biz', '🏭', 'Negócios'], ['nb_contracts', '📜', 'Encomendas'], ['nb_market', '🎪', 'Feiras e leilões'], ['nb_log', '📒', 'Ocorrências']);
  const bh0 = BizBoard.html.bind(BizBoard);
  BizBoard.html = function () {
    const h = bh0(), t = UI.sel.bzTab; if (!/^nb_/.test(t || '')) return h;
    const i = h.indexOf('<div class="bzb-page'); if (i < 0) return h;
    UI.sel.bbTab = t.slice(3);
    return h.slice(0, i) + `<div class="bzb-page bzb-nb">${NegBoard.parts(t.slice(3)).body.replace('sv-pl', 'sv-pl bzb-pg')}</div>`;
  };
  PF_GONE['x:board'] = 'biz';
  UI.showBizBoard = function (tab) {
    if ((tab || this.sel.bbTab) === 'guilds') { this.sel.bbTab = 'biz'; this.sel.knav = 'x:ordens'; return this.showKingdom(); } // as guildas agora são as sociedades
    tab = tab || this.sel.bbTab || 'biz'; if (!['biz', 'contracts', 'market', 'log'].includes(tab)) tab = 'biz';
    this.sel.bbTab = tab; this.sel.bzTab = 'nb_' + tab; this.sel.knav = 'biz'; return this.showKingdom();
  };
  // Grandes Casas e Linhagens
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    if (nav === 'tree') return Lines.html(kp0('tree'));
    if (nav === 'x:board' && typeof UIP !== 'undefined') return this.pageHead('📊', 'Negócios', 'Seus negócios, encomendas, feiras e leilões') + UIP.capture(() => UIP._raw.board(UI.sel.bbTab));
    if (nav === 'families') return this.pageHead('🏛️', 'Grandes Casas', `${Families.ranking().length} famílias e ${G.people.filter(p => p.alive).length} pessoas vivas no mundo`) + Houses.html();
    return kp0(nav);
  };
  // páginas que não cabem: divide em partes
  const sk0 = UI.showKingdom.bind(UI);
  UI.showKingdom = function (...a) {
    if (this.sel.knav === 'x:board') { this.sel.bzTab = 'nb_' + (this.sel.bbTab || 'biz'); this.sel.knav = 'biz'; } // atalhos antigos de Negócios
    const r = sk0(...a); if (['families', 'x:board', 'tree'].includes(this.sel.knav)) { try { Services.paginate(); } catch (e) { console.error(e); } } return r; };
}
