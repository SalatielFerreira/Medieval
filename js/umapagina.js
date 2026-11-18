'use strict';
// Janelas numa página só (no computador): o Conselho do Reinado em três colunas — as quatro cadeiras em linhas curtas,
// o dilema e os complôs (em partes ◀ 1/2 ▶) e a espionagem nos outros reinos com botões de ícone. As descrições longas
// de cada cargo e de cada ação viram dica (passe o mouse).
const OnePage = {
  pg(k, n, per) { const P = UI.sel.opPg || (UI.sel.opPg = {}), pages = Math.max(1, Math.ceil(n / per)); P[k] = U.clamp(P[k] || 0, 0, pages - 1); return { from: P[k] * per, nav: pages > 1 ? `<span class="lj-nav"><button data-act="oppg" data-k="${k}" data-d="-1" ${P[k] ? '' : 'disabled'}>◀</button><b>${P[k] + 1}/${pages}</b><button data-act="oppg" data-k="${k}" data-d="1" ${P[k] < pages - 1 ? '' : 'disabled'}>▶</button></span>` : '' }; },
  seats(ci) {
    const esc = UI.esc.bind(UI);
    return Object.keys(COUNCIL).map(seat => {
      const d = COUNCIL[seat], p = Court.member(ci, seat);
      const who = p ? `<b>${esc(People.full(p))}${p.exposed ? ' <i class="bad">CORRUPTO</i>' : ''}</b><small>${esc(People.title(p))}, ${p.age} anos${Families.of(p) ? ' · Casa ' + esc(Families.of(p).surname) : ''}</small>
          <span class="op-st"><i title="competência">⭐ ${p.comp}</i><i class="${p.aff < 15 ? 'bad' : p.aff > 50 ? 'ok' : ''}" title="lealdade">💛 ${Math.round(p.aff)}</i><i class="${(p.amb || 0) > 60 ? 'bad' : ''}" title="ambição">🔥 ${Math.round(Court.traits(p).amb || 0)}</i></span>`
        : '<b class="muted">Cargo vago</b><small>ninguém nomeado</small>';
      return `<div class="op-seat ${p ? '' : 'empty'}" title="${esc(d.desc)}"><span class="op-ic">${d.icon}</span><div class="op-who"><em>${p && p.sex === 'f' ? d.f : d.m}</em>${who}</div>
        <span class="op-bt">${p ? `<button data-act="tk" data-op="open" data-id="${p.id}" title="Falar">💬</button><button data-act="cdismiss" data-c="${ci}" data-s="${seat}" title="Dispensar">✖</button>` : ''}<button class="${p ? '' : 'primary'}" data-act="cpick" data-s="${seat}">${p ? 'Trocar' : 'Nomear'}</button></span></div>`;
    }).join('');
  },
  plots() {
    const R = Reign.R(), esc = UI.esc.bind(UI), pl = R.plots.filter(p => p.found), g = this.pg('plots', pl.length, 3);
    const rows = pl.slice(g.from, g.from + 3).map(x => { const i = R.plots.indexOf(x), p = G.people[x.pid];
      return `<div class="op-plot"><span><b>${p ? esc(People.full(p)) : '?'}</b><small>${x.seat ? `${esc(Reign.seatName(x.seat, p).toLowerCase())} · ` : ''}${Reign.PLOT_TXT[x.kind] || 'trama contra você'}</small></span>
        <span class="op-bt"><button data-act="rgPlot" data-i="${i}" data-h="arrest" title="Prender">⛓️</button><button data-act="rgPlot" data-i="${i}" data-h="exile" title="Exilar">🚪</button><button class="danger" data-act="rgPlot" data-i="${i}" data-h="execute" title="Executar">⚔️</button><button data-act="rgPlot" data-i="${i}" data-h="pardon" title="Perdoar">🕊️</button></span></div>`; }).join('');
    // quem pode tramar (as três famílias mais perigosas)
    const t = document.createElement('template'); t.innerHTML = Reign.plotsHtml();
    const risk = [...t.content.querySelectorAll('.card > *')].filter(e => /Quem pode tramar|tramar/.test(e.textContent) && !e.classList.contains('sec')).map(e => e.outerHTML).join('');
    return `<div class="op-box op-plots"><div class="sec">🗡️ Complôs <span>descobrir: ${Math.round(Reign.spySkill())}%/mês</span>${g.nav}</div>${rows || '<p class="muted op-none">Nenhum complô descoberto.</p>'}${risk ? `<div class="op-risk">${risk}</div>` : ''}</div>`;
  },
  dilemma() {
    const R = Reign.R(), D = R.dilemma && Reign.DILEMMAS.find(x => x.id === R.dilemma.id), esc = UI.esc.bind(UI);
    if (!D) return '<div class="op-box op-dil"><div class="sec">📜 Dilema do mês</div><p class="muted op-none">Nenhum dilema agora: o conselho se reúne todo mês.</p></div>';
    const dm = Reign.member(D.who, R.dilemma.ci);
    return `<div class="op-box op-dil"><div class="sec">${COUNCIL[D.who].icon} Dilema <span>${dm ? esc(dm.name) : 'o conselho'} · sem resposta, vale a 1ª</span></div><p><b>${esc(D.t)}</b></p><div class="op-ans">${D.o.map((o, i) => `<button data-act="rgAns" data-i="${i}">${esc(o[0])}</button>`).join('')}</div></div>`;
  },
  spies() {
    const R = Reign.R(), c = Reign.main();
    const rows = G.civs.filter(o => o && !o.dead && o.ruler !== 'player').map(o => { const s = R.spies[o.id];
      const info = s ? `🛡️ ${o.garrison} · 🪙 ${o.treasury} · 😊 ${Math.round(o.happy)}${Diplo.warsOf(o.id).length ? ' · em guerra' : ''}${c && Diplo.rel(o.id, c.id) < -35 ? ' · <b class="bad">planejam guerra</b>' : ''}` : '<i class="muted">sem espião</i>';
      return `<div class="op-spy"><span>${Heraldry.armsSvg(o.id, 16)}</span><span><b>${CIV_DEFS[o.id].short}</b><small>${info}</small></span><span class="op-bt">${s ? `<button data-act="rgMis" data-c="${o.id}" data-k="sabotage" title="Sabotar (100 🪙)">🔥</button><button data-act="rgMis" data-c="${o.id}" data-k="steal" title="Roubar (60 🪙)">💰</button><button class="danger" data-act="rgMis" data-c="${o.id}" data-k="kill" title="Matar o herdeiro (300 🪙)">☠️</button>` : `<button data-act="rgSpy" data-c="${o.id}" title="Infiltrar um espião (100 🪙)">🗡️ 100</button>`}</span></div>`; }).join('');
    return `<div class="op-box op-spies"><div class="sec">🕵️ Espionagem <span>${Object.keys(R.spies).length} espião(ões)</span></div>${rows}</div>`;
  },
  conselho(ci, c, main, orig) {
    if (UI.sel.cseat || document.body.classList.contains('small')) return orig; // a lista para escolher alguém ocupa a página inteira (e no celular fica o de antes)
    return `<div class="card wide op op-cons"><div class="op-cols">
      <div class="op-box op-seats"><div class="sec">🎩 O conselho de ${CIV_DEFS[ci].short} <span>⭐ competência · 💛 lealdade · 🔥 ambição</span></div>${this.seats(ci)}</div>
      <div class="op-col">${main ? this.dilemma() + this.plots() : '<div class="op-box"><p class="muted">Os dilemas, o julgamento dos complôs e os espiões ficam no reino principal.</p></div>'}</div>
      ${main ? this.spies() : ''}</div></div>`;
  },
};

{
  const co0 = Reinado.T.conselho.bind(Reinado.T);
  Reinado.T.conselho = function (ci, c, main, ...a) { const orig = co0(ci, c, main, ...a); try { return OnePage.conselho(ci, c, main, orig); } catch (e) { console.error(e); return orig; } };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'oppg') { const P = this.sel.opPg || (this.sel.opPg = {}); P[d.k] = (P[d.k] || 0) + +d.d; this.refresh(); return; } return a0(a, d); };
}

// a vila que você governa numa página: três colunas (prosperidade e economia · crescer, eleição e governo · defesa,
// lojas e guardas); a era vira uma linha no quadro da prosperidade e as explicações longas viram dica
{
  const vg0 = Reinado.village.bind(Reinado);
  Reinado.village = function (vi) {
    const html = vg0(vi);
    if (document.body.classList.contains('small')) return html;
    try {
      const t = document.createElement('template'); t.innerHTML = html;
      const take = cls => { const e = t.content.querySelector(`.card.${cls}`); if (e) e.remove(); return e; };
      const grow = take('va-grow'), econ = take('va-econ'), shops = take('va-shops'), guards = take('rn-guards'), tips = take('va-tips'), pol = take('pol-v'), acts = take('rn-vacts'), def = take('vd-card'), era = take('era-card');
      if (era && grow && typeof Era !== 'undefined') { const nr = Era.nextRoad(); grow.insertAdjacentHTML('beforeend', `<div class="vj-era" title="${UI.esc(era.textContent.trim())}">📜 Era: vilas até o nível ${Math.min(VILLAGE_MAX, 1 + Math.floor(Era.years() / ERA_VILLAGE))} · estradas até o nível ${Era.roadMax()}${nr ? ` · próxima melhoria em ${nr} anos` : ''}</div>`); }
      for (const c of [acts, def]) { const p = c && c.querySelector(':scope > p.dt-desc'); if (p) { c.title = p.textContent.trim(); p.remove(); } }
      { const sg = shops && shops.querySelector('.va-shopgrid'); if (sg) sg.classList.add('kscroll'); } // muitas lojas rolam por dentro
      const col = list => `<div class="vj-col">${list.filter(Boolean).map(e => e.outerHTML).join('')}</div>`;
      const rest = [...t.content.childNodes].map(n => n.outerHTML || n.textContent || '').join('');
      // sem guardas, o quadro deles vira uma linha dentro da defesa
      const noGuard = guards && !guards.querySelector('.crow, .rn-row, button');
      if (noGuard && def) { def.insertAdjacentHTML('beforeend', `<div class="vj-era">🛡️ ${UI.esc(guards.querySelector('.sec') ? guards.querySelector('.sec').textContent.trim() : 'Guardas')} · converse com um capanga e escolha "Mandar fazer guarda"</div>`); }
      return `${rest}<div class="vj">${col([grow, econ])}${col([tips, pol])}${col([def, acts, shops, noGuard ? null : guards])}</div>`;
    } catch (e) { console.error(e); return html; }
  };
}

// Diplomacia numa página: cada reino numa linha em colunas — nome · relação · a situação em selos de ícone (aliado,
// guerra, não agressão, comércio +renda, tributo, vassalo, direito ao trono) · os botões só com o ícone e o valor
// (o texto inteiro fica na dica). Na guerra, o que não dá para fazer sai; um só botão de refém. A lista rola por dentro.
{
  const ST = t => {
    if (/^GUERRA/i.test(t)) return ['⚔️', '', 'war', 'Em guerra'];
    if (/^ALIADO/i.test(t)) return ['🤝', '', 'ok', 'Aliado'];
    const ic = t.split(/\s+/)[0]; let v = '';
    if (/comércio/.test(t)) v = '+' + ((t.match(/\+(\d+)/) || [])[1] || '');
    else if (/recebe (\d+)/.test(t)) v = '+' + t.match(/recebe (\d+)/)[1];
    else if (/paga (\d+)/.test(t)) v = '−' + t.match(/paga (\d+)/)[1];
    return [ic, v, /paga/.test(t) ? 'bad' : '', t];
  };
  const dp0 = Reinado.T.diplo.bind(Reinado.T);
  Reinado.T.diplo = function (...a) {
    const html = dp0(...a);
    if (document.body.classList.contains('small')) return html;
    try {
      const t = document.createElement('template'), esc = UI.esc.bind(UI); t.innerHTML = html;
      const card = t.content.querySelector('.card.rn-dips'); if (!card) return html;
      const rows = [...card.querySelectorAll(':scope > .rn-dip')].map(row => {
        const nm = row.querySelector('.rn-dn'), ar = row.querySelector('.act-row'), gauge = [...row.children].find(e => e !== nm && e !== ar);
        if (row.classList.contains('mine') || !ar) return `<div class="dpx mine">${nm ? nm.outerHTML : ''}<span class="dpx-me">👑 seu reino</span></div>`;
        const tags = [...ar.querySelectorAll('.tag, .badge')].map(s => ST(s.textContent.trim())), war = tags.some(x => x[2] === 'war');
        let hostage = 0; const btns = [];
        for (const b of ar.querySelectorAll('button')) {
          const txt = b.textContent.trim(), x = b.dataset.x;
          if (war && b.disabled) continue;
          if (x === 'ally' && tags.some(g => g[2] === 'ok')) continue;
          if (/Entregar /.test(txt) && hostage++) continue;
          const ic = txt.split(/\s+/)[0], num = (txt.match(/(\d+%|\d[\d.]*)(?!.*\d)/) || [])[1] || '';
          let lab = ic + (num && !/Entregar|refém/.test(txt) ? ' ' + num : '');
          if (x === 'war') lab = '⚔️';
          if (/Romper/.test(txt)) { lab = ic + '<small>✕</small>'; b.classList.add('undo'); }
          b.title = (b.title && b.title !== txt ? `${txt} — ${b.title}` : txt);
          b.innerHTML = lab; b.classList.add('dp-ic'); btns.push(b.outerHTML);
        }
        return `<div class="dpx ${war ? 'war' : ''}">${nm ? nm.outerHTML : ''}${gauge ? gauge.outerHTML : ''}<span class="dpx-st">${tags.map(([ic, v, cls, tt]) => `<i class="${cls}" title="${esc(tt)}">${ic}${v ? `<b>${v}</b>` : ''}</i>`).join('') || '<small class="muted">sem tratados</small>'}</span><span class="dpx-ac">${btns.join('')}</span></div>`;
      });
      const sec = card.querySelector(':scope > .sec'); if (sec) { const sp = sec.querySelector('span'); if (sp) sp.textContent = 'os custos saem do tesouro · passe o mouse nos ícones para ver o que fazem'; }
      card.classList.add('dpx-card');
      card.innerHTML = (sec ? sec.outerHTML : '') + `<div class="dpx-head"><span>Reino</span><span>Relação</span><span>Situação</span><span>Ações</span></div><div class="dpx-list kscroll">${rows.join('')}</div>`;
      return [...t.content.childNodes].map(n => n.outerHTML || n.textContent || '').join('');
    } catch (e) { console.error(e); return html; }
  };
}
