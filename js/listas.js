'use strict';
// Listas e quadros mais claros:
//  • Listas para escolher alguém (cargos da corte, da loja da sociedade, candidatos, procurados) com o mesmo jeito: a
//    família primeiro (com a etiqueta Seu filho, Sua neta...), filtros no alto, cada pessoa com o que importa; quem já
//    ocupa outro cargo não aparece na lista de um cargo diferente.
//  • Diplomacia: a relação entre reinos (−100 a +100) num medidor que cresce do centro, com o número num selo colorido.
//  • Leis e justiça em duas páginas: 1) os decretos e as leis; 2) o tribunal, a prisão e os procurados lado a lado,
//    cada um com as suas listas em partes (◀ 1/3 ▶) para caber sem rolar.
UI.pickIcon = q => Court.relLabel(q) ? (q.spouse === 'player' ? '💍' : '👪') : G.civs.some(c => c && c.rulerId === q.id) ? '👑' : NOBLE_RANKS.includes(q.rank) ? '🎖️' : q.rank === 'knight' ? '🛡️' : q.sex === 'f' ? '👩' : '🧑';
UI.pickRow = (q, o) => { const rel = Court.relLabel(q); return `<div class="rn-row rn-pick ${rel ? 'fam' : ''} ${o.on ? 'on' : ''}"><span class="ri">${UI.pickIcon(q)}</span><span><b>${UI.esc(People.full(q))}${rel ? ` <i class="rn-kin">${rel}</i>` : ''}</b><small>${o.sub || ''}</small>${o.info ? `<small>${o.info}</small>` : ''}</span><span class="act-row">${o.btn || ''}</span></div>`; };
UI.pickChips = (act, op, cur, list, n) => `<div class="act-row rn-cfilt">${list.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-op="${op}" data-k="${k}">${l}</button>`).join('')}${n !== undefined ? `<span class="muted">${n} ${n === 1 ? 'pessoa' : 'pessoas'}</span>` : ''}</div>`;
UI.relWord = r => r >= 60 ? 'grandes amigos' : r >= 25 ? 'amigos' : r > -25 ? 'neutros' : r > -60 ? 'hostis' : 'inimigos';
UI.relGauge = r => `<span class="rn-rel" title="Relação ${r > 0 ? '+' : ''}${r} (${UI.relWord(r)})"><span class="dpg">${[25, 75].map(x => `<s style="left:${x}%"></s>`).join('')}<i class="${r >= 0 ? 'p' : 'n'}" style="width:${Math.min(50, Math.abs(r) / 2)}%"></i><em></em></span><span class="dpv"><b class="${r >= 15 ? 'pos' : r <= -15 ? 'neg' : 'neu'}">${r > 0 ? '+' : ''}${r}</b><small>${UI.relWord(r)}</small></span></span>`;

// ---------------------------------------------------------------- Leis e justiça em duas páginas
const LJ = {
  pg(k, n, per) { const P = UI.sel.ljPg || (UI.sel.ljPg = {}), pages = Math.max(1, Math.ceil(n / per)); P[k] = U.clamp(P[k] || 0, 0, pages - 1); return { i: P[k], pages, from: P[k] * per, nav: pages > 1 ? `<span class="lj-nav"><button data-act="ljpg" data-k="${k}" data-d="-1" ${P[k] ? '' : 'disabled'}>◀</button><b>${P[k] + 1}/${pages}</b><button data-act="ljpg" data-k="${k}" data-d="1" ${P[k] < pages - 1 ? '' : 'disabled'}>▶</button></span>` : '' }; },
  small() { return document.body.classList.contains('small'); },
  court() {
    const L = Laws.L(), esc = UI.esc.bind(UI), cs = L.cases, p = this.pg('case', cs.length, 1), c = cs[p.from];
    const body = c ? `<div class="lj-case ${c.grave ? 'grave' : ''}"><b>⚖️ ${esc(c.crime)}: ${esc(c.name)}</b><small>${esc(World.villages[c.vi] ? World.villages[c.vi].name : '')} · desde ${Calendar.short(c.day)}</small>
        <p>Acusado(a) de que ${esc(c.text)}. Acusação de <b>${esc(c.victim)}</b>.</p>
        <div class="lj-ev"><span>Provas</span><i><i style="width:${c.ev}%;background:${c.ev >= 70 ? '#5fd35f' : c.ev >= 40 ? '#e8c06a' : '#c0392b'}"></i></i><b>${c.ev}%</b></div><small class="muted">${c.wit} testemunha(s) · ${c.ev >= 70 ? 'provas fortes' : c.ev >= 40 ? 'provas duvidosas' : 'quase nada contra'}</small>
        <div class="lj-vs">${VERDICTS.filter(([k]) => k !== 'combate' || Laws.has('combate')).map(([k, l]) => `<button class="${k === 'forca' ? 'danger' : k === 'absolver' ? 'primary' : ''}" data-act="lawJudge" data-i="${c.id}" data-v="${k}">${l}</button>`).join('')}</div></div>`
      : '<div class="lj-empty">⚖️<small>Nenhum caso esperando julgamento. Novos casos chegam todo mês.</small></div>';
    const last = L.log[0];
    return `<section class="lj-c lj-court"><div class="sec">🏛️ Tribunal <span>${cs.length} caso(s) · juiz ${Laws.justiceName()}</span>${p.nav}</div>${body}${last ? `<div class="lj-last"><small>${Calendar.short(last.day)}</small> ${esc(last.t)}</div>` : ''}</section>`;
  },
  jail(ci) {
    const esc = UI.esc.bind(UI), L = Justice.jail(ci), S = Justice.S(), Q = (S.queue[ci] || []);
    const cell = c => `<div class="lj-cell"><div class="lj-ch">⛓️ Cela ${c + 1}</div>${Array.from({ length: JAIL_PER_CELL }, (_, k) => { const x = L[c * JAIL_PER_CELL + k], p = x && G.people[x.pid];
      return p ? `<div class="lj-pr ${x.until ? '' : 'wait'}" title="${esc(People.full(p))} · ${esc(x.why)}"><span><b>${esc(p.name)}</b><small>${esc(x.why)} · ${x.until ? `${Math.max(0, x.until - G.day)} m` : 'você decide'}</small></span><span><button data-act="ju" data-op="free" data-p="${p.id}" data-c="${ci}" title="Soltar">🔓</button>${x.until ? '' : `<button data-act="ju" data-op="keep" data-p="${p.id}" data-c="${ci}" title="Manter 6 meses">⏳</button>`}<button class="danger" data-act="ju" data-op="kill" data-p="${p.id}" data-c="${ci}" title="Condenar à morte">☠️</button></span></div>` : '<div class="lj-pr free">— livre —</div>'; }).join('')}</div>`;
    return `<section class="lj-c lj-jail"><div class="sec">⛓️ Prisão de ${CIV_DEFS[ci].short} <span>${L.length}/${JAIL_CAP}${Justice.full(ci) ? ' · <b class="bad">lotada</b>' : ''}</span></div><div class="lj-cells">${Array.from({ length: JAIL_CELLS }, (_, c) => cell(c)).join('')}</div>
      ${Q.length ? `<small class="lj-q">⏳ ${Q.length} esperando vaga: ${Q.slice(0, 3).map(x => G.people[x.pid] ? esc(G.people[x.pid].name) : '?').join(', ')}</small>` : ''}</section>`;
  },
  wanted(ci) {
    const esc = UI.esc.bind(UI), S = Justice.S(), per = this.small() ? 2 : 4;
    if (UI.sel.juPick) {
      const f = ['met', 'realm', 'foe'].includes(UI.sel.juF) ? UI.sel.juF : 'all';
      let L = G.people.filter(p => p.alive && p.met && p.age >= 16 && !p.capanga && !p.kin && p.spouse !== 'player' && !Justice.wanted(p).includes(ci));
      if (f === 'realm') L = L.filter(p => Families.civOf(p) === ci); if (f === 'foe') L = L.filter(p => (p.aff || 0) < 0 || p.hostile);
      L.sort((a, b) => (a.aff || 0) - (b.aff || 0));
      const p = this.pg('pick', L.length, per);
      return `<section class="lj-c lj-want"><div class="sec">📜 Declarar procurado <span>quem você conhece</span>${p.nav}</div>
        ${UI.pickChips('ljf', 'f', f, [['all', '👥 Todos'], ['realm', `🏰 De ${CIV_DEFS[ci].short}`], ['foe', '😠 Desafetos']], L.length)}
        <div class="lj-list">${L.slice(p.from, p.from + per).map(q => UI.pickRow(q, { sub: `${esc(People.title(q))} · ${esc(People.homeName(q))}`, info: `💛 ${Math.round(q.aff || 0)}`, btn: `<button class="danger" data-act="ljwant" data-p="${q.id}" data-c="${ci}">📜 Procurado</button>` })).join('') || '<p class="muted">Ninguém aqui.</p>'}</div>
        <div class="act-row lj-back"><button data-act="ljpick">◀ Voltar</button></div></section>`;
    }
    const W = Object.entries(S.wanted).filter(([, L]) => L.includes(ci)).map(([pid]) => G.people[+pid]).filter(p => p && p.alive), p = this.pg('want', W.length, per);
    return `<section class="lj-c lj-want"><div class="sec">📜 Procurados pela coroa <span>${W.length}</span>${p.nav}</div>
      <div class="lj-list">${W.slice(p.from, p.from + per).map(q => UI.pickRow(q, { sub: `${esc(People.title(q))} · ${esc(People.homeName(q))}`, btn: `<button data-act="ju" data-op="unwant" data-p="${q.id}" data-c="${ci}">Retirar</button>` })).join('') || '<div class="lj-empty">📜<small>Ninguém procurado. Se um procurado pisar no seu reino, os guardas o pegam.</small></div>'}</div>
      <div class="act-row lj-back"><button class="primary" data-act="ljpick">📜 Declarar alguém procurado</button></div></section>`;
  },
  page(ci, c, orig) {
    const t = document.createElement('template'); t.innerHTML = orig;
    const box = t.content.querySelector('.law-box');
    return `<div class="lj lj1">${box ? box.outerHTML : ''}</div><div class="card wide lj lj2"><div class="lj-cols">${this.court()}${this.jail(ci)}${this.wanted(ci)}</div></div>`;
  },
};

{
  const le0 = Reinado.T.leis.bind(Reinado.T);
  Reinado.T.leis = function (ci, c, ...a) { const orig = le0(ci, c, ...a); try { return LJ.page(ci, c, orig); } catch (e) { console.error(e); return orig; } };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'ljpg') { const P = this.sel.ljPg || (this.sel.ljPg = {}); P[d.k] = (P[d.k] || 0) + +d.d; this.refresh(); return; }
    if (a === 'ljpick') { this.sel.juPick = !this.sel.juPick; this.refresh(); return; }
    if (a === 'ljf') { this.sel.juF = d.k; (this.sel.ljPg || (this.sel.ljPg = {})).pick = 0; this.refresh(); return; }
    if (a === 'ljwant') { const p = People.get(+d.p); if (p) { Justice.declare(p, +d.c); UI.msg(`📜 ${People.full(p)} agora é procurad${p.sex === 'f' ? 'a' : 'o'} em ${CIV_DEFS[+d.c].short}.`, 'gold'); } this.sel.juPick = false; this.refresh(); return; }
    return a0(a, d);
  };
}
