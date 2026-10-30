'use strict';
// Empreendimentos (Portfólio) em páginas, cada uma cabendo inteira na janela, com o acompanhamento mês a mês:
//  📊 Painel: quanto entrou, salários e lucro do último mês comparados com o mês anterior, a previsão do próximo, o
//     gráfico dos últimos 12 meses, os destaques e a produção
//  💼 Seus empreendimentos: um cartão por empreendimento, com o resultado do mês, a tendência e o gráfico do lucro
//  📒 Contas: a tabela de cada empreendimento (último mês e desde o início) · ⚔️ Concorrência
// O que não cabe se divide em partes (◀ 1/2 ▶). O histórico fica em s.earn.hist ([faturamento, salários, mês], até 12),
// gravado quando o mês fecha.
const BZ_HIST = 12;

const BizBoard = {
  TABS: [['painel', '📊', 'Painel'], ['lista', '💼', 'Seus empreendimentos'], ['contas', '📒', 'Contas'], ['rival', '⚔️', 'Concorrência']],
  hist(s) {
    const e = Biz.earn(s);
    if (!e.hist) e.hist = e.last ? [[e.last.rev, e.last.wages, G.day - 1]] : []; // jogos salvos antes: começa pelo último mês
    return e.hist;
  },
  // fecha o mês: guarda o resultado de cada empreendimento
  close() {
    for (const s of Biz.list()) { const e = Biz.earn(s), h = this.hist(s); h.push([e.cur.rev, e.cur.wages, G.day - 1]); if (h.length > BZ_HIST) h.splice(0, h.length - BZ_HIST); }
  },
  // a soma de todos, mês a mês (o mais antigo primeiro)
  series() {
    const by = {};
    for (const s of Biz.list()) for (const [r, w, d] of this.hist(s)) { const x = by[d] || (by[d] = [0, 0, d]); x[0] += r; x[1] += w; }
    return Object.values(by).sort((a, b) => a[2] - b[2]).slice(-BZ_HIST);
  },
  money(n) { return (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('pt-BR'); },
  // ▲ 12% / ▼ 5% em relação ao mês anterior
  delta(cur, prev, bad) {
    if (prev === undefined || prev === null) return '<em class="bzb-d">—</em>';
    if (cur === prev) return '<em class="bzb-d">= igual</em>';
    const up = cur > prev, good = bad ? !up : up;
    const pct = prev ? Math.round(Math.abs(cur - prev) / Math.abs(prev) * 100) : null;
    return `<em class="bzb-d ${good ? 'ok' : 'bad'}">${up ? '▲' : '▼'} ${pct === null ? this.money(Math.abs(cur - prev)) + ' 🪙' : pct + '%'}</em>`;
  },
  // o que a série diz: subindo, caindo ou parado
  trend(S) {
    const p = S.map(x => x[0] - x[1]);
    if (p.length < 2) return { cls: '', txt: p.length ? 'Primeiro mês fechado: a comparação aparece no mês que vem.' : 'Nenhum mês fechado ainda: os números aparecem quando o mês virar.' };
    let n = 1; const up = p[p.length - 1] > p[p.length - 2];
    while (n < p.length - 1 && (p[p.length - n] > p[p.length - n - 1]) === up && p[p.length - n] !== p[p.length - n - 1]) n++;
    if (p[p.length - 1] === p[p.length - 2]) return { cls: '', txt: 'O lucro ficou igual ao do mês anterior.' };
    const avg = Math.round(p.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, p.length));
    return { cls: up ? 'ok' : 'bad', txt: `${up ? '📈 Seus ganhos estão subindo' : '📉 Seus ganhos estão caindo'}${n > 1 ? ` há ${n} meses seguidos` : ' em relação ao mês anterior'} · média dos últimos ${Math.min(3, p.length)} meses: ${this.money(avg)} 🪙 de lucro.` };
  },
  // gráfico: entrou (verde) e salários (vermelho) de cada mês, com o lucro embaixo
  chart(S) {
    if (!S.length) return '<div class="bzb-empty">📊<small>O gráfico começa quando o primeiro mês fechar.</small></div>';
    const mx = Math.max(1, ...S.map(x => Math.max(x[0], x[1])));
    return `<div class="bzb-chart">${S.map(([r, w, d]) => `<div class="bzb-col"><div class="bzb-bars"><i class="in" style="height:${r / mx * 100}%" title="Entrou ${this.money(r)} 🪙"></i><i class="out" style="height:${w / mx * 100}%" title="Salários ${this.money(w)} 🪙"></i></div>
      <b class="${r - w >= 0 ? 'ok' : 'bad'}">${this.money(r - w)}</b><small>${Calendar.text(Math.max(1, d)).slice(0, 3)}</small></div>`).join('')}</div>
      <div class="bzb-leg"><span><i class="in"></i> Entrou</span><span><i class="out"></i> Salários</span><span>número = lucro do mês</span></div>`;
  },
  spark(h) {
    if (h.length < 2) return '';
    const p = h.map(x => x[0] - x[1]), mx = Math.max(...p), mn = Math.min(...p, 0);
    return `<span class="bzb-spark">${p.map(v => `<i class="${v < 0 ? 'neg' : ''}" style="height:${Math.round(12 + (v - mn) / Math.max(1, mx - mn) * 88)}%"></i>`).join('')}</span>`;
  },
  tabs(tab, n) {
    return `<div class="tabs subtabs bzb-tabs">${this.TABS.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="bzbtab" data-t="${k}">${ic} ${l}${k === 'lista' ? ` (${n})` : ''}</button>`).join('')}</div>`;
  },
  html() {
    const S0 = UI.sel, tab = this.TABS.some(t => t[0] === S0.bzTab) ? S0.bzTab : 'painel', biz = Biz.list(), m = this.money.bind(this);
    const head = UI.pageHead('💼', 'Empreendimentos', 'Construa em Construir → Empreendimentos e contrate moradores das vilas') + this.tabs(tab, biz.length);
    const S = this.series(), L = S[S.length - 1], PV = S[S.length - 2];
    const lr = L ? L[0] : 0, lw = L ? L[1] : 0, fcs = biz.map(b => ({ b, fc: Biz.forecast(b) }));
    const wages = fcs.reduce((a, x) => a + x.fc.wages, 0), fRev = fcs.reduce((a, x) => a + x.fc.gold + Biz.goodsValue(x.fc.out, x.b), 0);
    const T = Biz.totals(), till = biz.reduce((a, b) => a + (b.till || 0), 0);
    const staff = biz.reduce((a, b) => a + Biz.workerCount(b), 0), slots = biz.reduce((a, b) => a + BIZ_TYPES[b.type].slots, 0);
    const lastOf = b => { const h = this.hist(b); return { L: h[h.length - 1], P: h[h.length - 2], h }; };
    let body;
    if (tab === 'painel') {
      const tr = this.trend(S);
      const kpi = (ic, lab, val, cls, sub) => `<div class="bzb-kpi"><span>${ic}</span><small>${lab}</small><b class="${cls || ''}">${val}</b>${sub || ''}</div>`;
      const ranked = biz.map(b => { const x = lastOf(b); return { b, p: x.L ? x.L[0] - x.L[1] : null }; }).filter(x => x.p !== null).sort((a, b) => b.p - a.p);
      const made = {}; for (const x of fcs) for (const it in x.fc.out) if (x.fc.out[it] > 0) made[it] = (made[it] || 0) + x.fc.out[it];
      const madeHtml = Object.entries(made).map(([it, n]) => `<span class="bz-chip">${UI.ii(it)} <b>+${n}</b> ${ITEMS[it].name}</span>`).join('');
      const row = (lab, b, p) => `<div class="bzb-row"><small>${lab}</small><span>${Game.buildIcon(b.type)} ${BUILDINGS[b.type].name}</span><b class="${p >= 0 ? 'ok' : 'bad'}">${m(p)} 🪙</b></div>`;
      body = `<div class="bzb-page bzb-painel">
        <div class="bzb-kpis">
          ${kpi('💰', 'Entrou no último mês', `+${m(lr)} 🪙`, 'ok', this.delta(lr, PV && PV[0]))}
          ${kpi('💸', 'Salários do último mês', `−${m(lw)} 🪙`, 'bad', this.delta(lw, PV && PV[1], true))}
          ${kpi('📈', 'Lucro do último mês', `${m(lr - lw)} 🪙`, lr - lw >= 0 ? 'ok' : 'bad', this.delta(lr - lw, PV && PV[0] - PV[1]))}
          ${kpi('🔮', 'Previsão do próximo mês', `${m(fRev - wages)} 🪙`, fRev - wages >= 0 ? 'ok' : 'bad', `<em class="bzb-d">entra ${m(fRev)} · sai ${m(wages)}</em>`)}
          ${kpi('🏦', 'Lucro desde o início', `${m(T.profit)} 🪙`, T.profit >= 0 ? 'ok' : 'bad', `<em class="bzb-d">entrou ${m(T.rev)} · caixa ${m(till)}</em>`)}
        </div>
        <div class="card bzb-hist"><div class="sec">📊 Seus ganhos mês a mês <span>últimos ${S.length || 0} de ${BZ_HIST} meses</span></div>
          <div class="bzb-trend ${tr.cls}">${tr.txt}</div>${this.chart(S)}</div>
        <div class="card bzb-side"><div class="sec">⭐ Destaques</div>
          ${ranked.length ? row('Melhor do mês', ranked[0].b, ranked[0].p) + (ranked.length > 1 ? row('Pior do mês', ranked[ranked.length - 1].b, ranked[ranked.length - 1].p) : '') : '<small class="muted">Os destaques aparecem quando o primeiro mês fechar.</small>'}
          <div class="bzb-row"><small>Funcionários</small><span>👷 ${staff}/${slots}</span><i class="bz-bar"><i style="width:${slots ? staff / slots * 100 : 0}%"></i></i></div>
          <div class="bzb-row"><small>Este mês até agora</small><span>entrou ${m(T.curRev)} · salários ${m(T.curWages)}</span><b class="${T.curRev - T.curWages >= 0 ? 'ok' : 'bad'}">${m(T.curRev - T.curWages)} 🪙</b></div>
          <div class="sec bzb-sub">📦 Produção por mês</div>
          <div class="bz-made">${madeHtml || `<span class="muted">${biz.length ? 'Contrate moradores para começar a produzir.' : 'Nada produzindo ainda: construa um empreendimento e contrate moradores das vilas.'}</span>`}</div>
          ${P.gold < wages * 3 && wages ? '<div class="bz-warn">⚠️ Pouco ouro para os salários: sem pagamento, os funcionários se revoltam.</div>' : ''}</div>
      </div>`;
    } else if (tab === 'lista') {
      body = `<div class="bzb-page bzb-lista bzb-pg">${biz.map(b => { const d = BIZ_TYPES[b.type], n = Biz.workerCount(b), x = lastOf(b), r = x.L ? x.L[0] : 0, w = x.L ? x.L[1] : 0;
        return `<div class="bzb-card ${n ? '' : 'idle'}"><div class="bzb-ch"><span class="bz-ic">${Game.buildIcon(b.type)}</span><b>${BUILDINGS[b.type].name}</b>
            <span class="bz-seats">${Array.from({ length: d.slots }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}<small>${n}/${d.slots}</small></span></div>
          <div class="bzb-cn"><span><small>Entrou</small><b class="ok">+${m(r)}</b></span><span><small>Salários</small><b class="bad">−${m(w)}</b></span><span><small>Lucro</small><b class="${r - w >= 0 ? 'ok' : 'bad'}">${m(r - w)}</b>${this.delta(r - w, x.P && x.P[0] - x.P[1])}</span></div>
          <div class="bzb-cf">${this.spark(x.h) || `<small class="muted">${x.L ? '1 mês fechado' : 'sem mês fechado'}</small>`}<small class="muted">${b.till ? `caixa ${m(b.till)} 🪙` : n ? '' : 'sem funcionários'}</small><button data-act="bizopen" data-s="${b.id}">Abrir</button></div></div>`; }).join('')
        || '<div class="bzb-empty">💼<small>Nenhum ainda. Construa uma Fazenda Comercial, Moinho, Serraria, Pedreira, Mina, Ferraria, Empório ou a sua Taverna, e contrate moradores das vilas próximas.</small></div>'}</div>`;
    } else if (tab === 'contas') {
      const rows = biz.map(b => { const x = lastOf(b), e = Biz.earn(b), r = x.L ? x.L[0] : 0, w = x.L ? x.L[1] : 0;
        return `<div class="bzb-tr"><span>${Game.buildIcon(b.type)} ${BUILDINGS[b.type].name}</span><span class="ok">+${m(r)}</span><span class="bad">−${m(w)}</span><b class="${r - w >= 0 ? 'ok' : 'bad'}">${m(r - w)}</b><span>${this.delta(r - w, x.P && x.P[0] - x.P[1])}</span><b class="${e.rev - e.wages >= 0 ? 'ok' : 'bad'}">${m(e.rev - e.wages)}</b></div>`; }).join('');
      body = `<div class="bzb-page bzb-contas"><div class="card bzb-table"><div class="sec">📒 Contas de cada empreendimento <span>${biz.length} ${biz.length === 1 ? 'empreendimento' : 'empreendimentos'}</span></div>
          <div class="bzb-tr head"><span>Empreendimento</span><span>Entrou (mês)</span><span>Salários (mês)</span><span>Lucro (mês)</span><span>vs. anterior</span><span>Lucro total</span></div>
          <div class="bzb-rows bzb-pg">${rows || '<small class="muted">Nenhum empreendimento ainda.</small>'}</div>
          <div class="bzb-tr tot"><span>Total</span><span class="ok">+${m(lr)}</span><span class="bad">−${m(lw)}</span><b class="${lr - lw >= 0 ? 'ok' : 'bad'}">${m(lr - lw)}</b><span>${this.delta(lr - lw, PV && PV[0] - PV[1])}</span><b class="${T.profit >= 0 ? 'ok' : 'bad'}">${m(T.profit)}</b></div>
          <small class="muted">Entrou = ouro do caixa + valor do que foi produzido (pelo preço de venda). A sua Taverna conta o que vendeu no balcão.</small></div></div>`;
    } else body = `<div class="bzb-page bzb-rival">${typeof Rivalry !== 'undefined' ? Rivalry.html() : ''}<small class="muted">Cada empreendimento seu numa vila tira fregueses das lojas que vendem o mesmo. Preços justos acalmam; indenizar resolve.</small></div>`;
    return head + body;
  },
  // o que não cabe vira páginas (◀ 1/2 ▶) no lugar das abas
  paginate() {
    const box = UI.panel && UI.panel.querySelector('.kpg .bzb-pg'); if (!box || document.body.classList.contains('small')) return;
    const page = box.closest('.bzb-page'), items = [...box.children], over = () => page.scrollHeight > page.clientHeight + 1 || box.scrollHeight > box.clientHeight + 1;
    if (!over() || items.length < 2) return;
    const pages = []; let start = 0;
    while (start < items.length) {
      items.forEach(c => { c.hidden = true; });
      let end = start;
      for (let i = start; i < items.length; i++) { items[i].hidden = false; if (over() && i > start) { items[i].hidden = true; break; } end = i + 1; }
      pages.push([start, end]); start = end;
    }
    const S = UI.sel, key = UI.sel.bzTab || 'painel'; S.bzPg = S.bzPg || {};
    const n = pages.length, k = Math.min(S.bzPg[key] || 0, n - 1);
    items.forEach((c, i) => { c.hidden = i < pages[k][0] || i >= pages[k][1]; });
    const tabs = UI.panel.querySelector('.bzb-tabs');
    if (tabs) tabs.insertAdjacentHTML('beforeend', `<span class="cr-pager"><button data-act="bzbpg" data-k="${key}" data-d="-1" ${k ? '' : 'disabled'}>◀</button><b>${k + 1}/${n}</b><button data-act="bzbpg" data-k="${key}" data-d="1" ${k < n - 1 ? '' : 'disabled'}>▶</button></span>`);
  },
};

{
  // fecha o mês de cada empreendimento antes de as contas zerarem
  const dt0 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function (...a) { try { BizBoard.close(); } catch (e) { console.error(e); } return dt0(...a); };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { return nav === 'biz' ? BizBoard.html() : kp0(nav); };
  const sk0 = UI.showKingdom.bind(UI);
  UI.showKingdom = function (...a) {
    const r = sk0(...a);
    if (this.sel.knav === 'biz') { try { BizBoard.paginate(); } catch (e) { console.error(e); } }
    return r;
  };
  const ac0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'bzbtab') { this.sel.bzTab = d.t; this.sel.knav = 'biz'; this.showKingdom(); return; }
    if (a === 'bzbpg') { const P0 = this.sel.bzPg || (this.sel.bzPg = {}); P0[d.k] = Math.max(0, (P0[d.k] || 0) + +d.d); this.showKingdom(); return; }
    return ac0(a, d);
  };
}
