'use strict';
// Reinado (Portfólio → Gestão → 👑 Reinado): uma janela só para tudo o que o herói governa.
//  • No alto, a faixa com os papéis do herói — um botão por reino seu, um por vila que ele governa e ⚜️ Títulos e corte,
//    que todo herói tem. O papel escolhido fica em UI.sel.rnRole ('k:<reino>', 'v:<vila>' ou 't').
//  • Papel de rei: a faixa do reino (tesouro, saldo do mês, povo, guarnição e alertas — esses números só aparecem ali) e
//    as abas Reino, Tesouro, Leis e justiça, Conselho, Vassalos e audiências, Diplomacia, Exército, Obras, Corte e Brasão
//    (UI.sel.rnTab). O que é da dinastia (orçamento, moeda, alfândega, dilemas, complôs, espiões, audiências, generais,
//    moral, herdeiros, baile, bobo, crônica e os tratados) aparece no reino principal; nos outros, um aviso leva até lá.
//  • Papel de governador: uma página com o crescimento, a economia, as lojas, a eleição, os guardas e "Deixar o governo".
//  • Títulos e corte: títulos (com as vantagens e a renúncia de cada um), corte e relação com os reinos, como virar
//    governador e fundar uma vila, e a Sociedade (UI.sel.crTab, como na antiga Coroa e títulos).
// Saíram do menu Seus reinos (k:), Suas vilas (v:), Coroa e títulos (crown), Vilas e guardas (villages), Finanças do
// reino (x:finance), Sociedade (x:society) e Tratados (x:pacts): Reinado.route() leva cada atalho antigo ao lugar novo.
// Cada número, quadro e ação aparece num lugar só.

const RN_TABS = [['reino', '📊', 'Reino'], ['tesouro', '💰', 'Tesouro'], ['leis', '⚖️', 'Leis e justiça'], ['conselho', '🎩', 'Conselho'], ['vassalos', '🏰', 'Vassalos e audiências'],
  ['diplo', '🤝', 'Diplomacia'], ['exercito', '⚔️', 'Exército'], ['obras', '🏗️', 'Obras'], ['corte', '🎭', 'Corte'], ['brasao', '⚜️', 'Brasão']];
// as abas antigas da página do reino (ksub) e do Reinado (rgTab) → a aba nova
const RN_KSUB = { resumo: 'reino', coroa: 'leis', economia: 'tesouro', obras: 'obras', exercito: 'exercito', conselho: 'conselho', diplo: 'diplo', brasao: 'brasao' };
const RN_RG = { council: 'conselho', spy: 'conselho', aud: 'vassalos', fiefs: 'vassalos', heirs: 'corte', diplo: 'diplo', pacts: 'diplo', money: 'tesouro', army: 'exercito', court: 'corte', law: 'leis', jus: 'leis' };
const RN_TIT = [['titulos', '⚜️', 'Títulos'], ['corte', '👑', 'Corte e reinos'], ['vilas', '🏘️', 'Vilas'], ['sociedade', '🤝', 'Sociedade']];

const Reinado = {
  // ---------------------------------------------------------------- papéis e caminhos
  roles() {
    const m = Reign.main(), out = [];
    for (const c of Reign.realms().sort((a, b) => (b === m) - (a === m) || a.id - b.id)) out.push({ k: 'k:' + c.id, ic: Heraldry.armsSvg(c.id, 18), label: CIV_DEFS[c.id].short, warn: this.kingAlerts(c.id).length });
    for (const { v, i } of Urban.myVillages()) out.push({ k: 'v:' + i, ic: '🏘️', label: v.name, warn: v.raid && v.raid.until >= G.day ? 1 : 0 });
    out.push({ k: 't', ic: '⚜️', label: 'Títulos e corte', warn: G.courtInvite ? 1 : 0 });
    return out;
  },
  role() {
    const S = UI.sel, R = this.roles();
    if (!R.some(r => r.k === S.rnRole)) S.rnRole = R[0].k;
    return S.rnRole;
  },
  // o reino aberto (ou o principal)
  ci() { const r = UI.sel.rnRole || ''; if (r.startsWith('k:') && G.civs[+r.slice(2)] && G.civs[+r.slice(2)].ruler === 'player') return +r.slice(2); const m = Reign.main(); return m ? m.id : -1; },
  // os atalhos antigos do Portfólio caem no Reinado (chamado por UI.showKingdom antes de montar a página)
  route() {
    const S = UI.sel, nav = S.knav || '', king = Reign.isKing(), main = Reign.main();
    const toKing = (ci, tab) => { if (G.civs[ci] && G.civs[ci].ruler === 'player') S.rnRole = 'k:' + ci; else if (main) S.rnRole = 'k:' + main.id; else { S.rnRole = 't'; return; } if (tab) S.rnTab = tab; };
    if (nav.startsWith('k:')) {
      const [id, tab] = nav.slice(2).split('/');
      toKing(+id, tab || (S.ksub ? RN_KSUB[S.ksub] : null)); S.ksub = null;
    } else if (nav.startsWith('v:')) S.rnRole = 'v:' + (+nav.slice(2));
    else if (nav === 'x:finance') { if (king) toKing(main.id, 'tesouro'); else S.rnRole = 't'; }
    else if (nav === 'x:pacts') { if (king) toKing(main.id, 'diplo'); else S.rnRole = 't'; }
    else if (nav === 'crown') S.rnRole = 't';
    else if (nav === 'villages') { S.rnRole = 't'; S.crTab = 'vilas'; }
    else if (nav === 'x:society') { S.rnRole = 't'; S.crTab = 'sociedade'; }
    else if (nav !== 'x:reign') return;
    S.knav = 'x:reign';
  },
  // abre o Reinado: go('rg', abaAntigaDoReinado) · go('t', páginaDeTítulos) · go('k:1', 'tesouro') · go('v:3')
  go(where, tab) {
    const S = UI.sel;
    if (where === 'rg') { const m = Reign.main(); if (m) { S.rnRole = 'k:' + m.id; if (tab) S.rnTab = RN_RG[tab] || tab; } else S.rnRole = 't'; }
    else if (where === 't') { S.rnRole = 't'; if (tab) S.crTab = tab; }
    else { S.rnRole = where; if (tab) S.rnTab = tab; }
    S.knav = 'x:reign'; UI.showKingdom();
  },
  refresh() { UI.sel.knav = 'x:reign'; UI.showKingdom(); },
  // o número do Reinado no menu: o que espera uma decisão sua
  badge() {
    let n = 0;
    for (const c of Reign.realms()) n += this.kingAlerts(c.id).length;
    for (const { v } of Urban.myVillages()) if (v.raid && v.raid.until >= G.day) n++;
    if (G.courtInvite) n++;
    return n;
  },
  // ---------------------------------------------------------------- alertas de um reino (com a aba que resolve)
  kingAlerts(ci) {
    const c = G.civs[ci], s = CIV_DEFS[ci].short, out = [], main = Reign.main() === c, R = Reign.R(), fc = Game.civForecast(c);
    if (c.rebel > 0) out.push(['⚠️', `O povo está à beira da revolta (${c.rebel}/3): baixe os impostos ou faça um festival.`, 'corte']);
    if (fc.wheat < fc.need) out.push(['🌾', 'Falta trigo: o povo vai passar fome. Invista em Fazendas Reais ou deposite trigo nos armazéns.', 'obras']);
    for (const r of (G.revolts || []).filter(r => !r.done && r.civ === ci)) out.push(['🔥', `A ${Families.name(Families.get(r.fam) || { surname: '?' })} se revoltou contra a coroa.`, 'reino']);
    if (typeof Bank !== 'undefined') { const K = Bank.K(ci); if (K.crisis) out.push(['🚨', `Crise financeira (${K.crisis}/${BANK_CRISIS}): o reino pode quebrar.`, 'tesouro']); else if (!Bank.has(ci)) out.push(['🏦', 'O reino não tem banco: ninguém cobre o tesouro no vermelho.', 'tesouro']); }
    if (Diplo.warsOf(ci).length) out.push(['⚔️', `Em guerra com ${Diplo.warsOf(ci).map(w => CIV_DEFS[w.a === ci ? w.b : w.a].short).join(', ')}.`, 'diplo']);
    for (const [vi, f] of Object.entries(R.fiefs)) { const v = World.villages[vi]; if (v && v.civ === ci && f.rebel) out.push(['🏴', `O barão de ${v.name} se revoltou.`, 'vassalos']); }
    if (main) {
      if (R.dilemma) out.push(['📜', 'O conselho espera a sua decisão sobre um dilema.', 'conselho']);
      const pl = R.plots.filter(p => p.found).length; if (pl) out.push(['🗡️', `${pl} complô(s) descoberto(s) esperando julgamento.`, 'conselho']);
      if (R.aud.length) out.push(['⚖️', `${R.aud.length} súdito(s) pedem audiência.`, 'vassalos']);
      if (typeof Laws !== 'undefined' && Laws.L().cases.length) out.push(['🏛️', `${Laws.L().cases.length} caso(s) esperando julgamento no tribunal.`, 'leis']);
    }
    void s;
    return out;
  },
  // ---------------------------------------------------------------- a página
  page() {
    const role = this.role(), S = UI.sel, esc = UI.esc.bind(UI);
    const roles = `<div class="rn-roles"><b class="rn-title">👑 Reinado</b><span class="rn-rbtns">${this.roles().map(r => `<button class="rn-role ${r.k === role ? 'on' : ''}" data-act="rnRole" data-k="${r.k}">${r.ic}<span>${esc(r.label)}</span>${r.warn ? `<em>${r.warn}</em>` : ''}</button>`).join('')}</span></div>`;
    if (role.startsWith('k:')) return roles + this.king(+role.slice(2));
    if (role.startsWith('v:')) return roles + this.village(+role.slice(2));
    void S;
    return roles + this.titles();
  },
  // ---------------------------------------------------------------- papel de rei
  king(ci) {
    const S = UI.sel, c = G.civs[ci], esc = UI.esc.bind(UI), main = Reign.main() === c;
    if (!RN_TABS.some(t => t[0] === S.rnTab)) S.rnTab = 'reino';
    const tab = S.rnTab, mo = Treasury.month(c), al = this.kingAlerts(ci);
    const chip = (ic, label, val, cls) => `<span class="rg-chip ${cls || ''}"><i>${ic}</i><small>${label}</small><b>${val}</b></span>`;
    const band = `<div class="rg-top"><span class="rg-arms">${Heraldry.armsSvg(ci, 26)}</span><span class="rg-who"><b>${esc(CIV_DEFS[ci].name)}</b><small>${Reign.titleName()} ${esc(G.name)}${Reign.realms().length > 1 ? (main ? ' · reino principal' : ` · principal: ${CIV_DEFS[Reign.main().id].short}`) : ''}</small></span>
      ${chip('🪙', 'Tesouro', c.treasury.toLocaleString('pt-BR'))}${chip('📈', 'Saldo do mês', (mo.net >= 0 ? '+' : '') + mo.net.toLocaleString('pt-BR'), mo.net < 0 ? 'bad' : '')}${chip('😊', 'Povo', Math.round(c.happy) + '%', c.happy < 30 ? 'bad' : '')}${chip('🛡️', 'Guarnição', `${c.garrison}/${Game.maxGarrison(c)}`)}${al.length ? chip('⚠️', 'Alertas', al.length, al.some(a => ['⚠️', '🚨', '🗡️', '🔥', '🏴'].includes(a[0])) ? 'bad' : 'warn') : ''}</div>`;
    const badge = k => { const n = al.filter(a => a[2] === k).length; return n ? ` <span class="badge">${n}</span>` : ''; };
    const tabs = `<div class="tabs subtabs rn-tabs">${RN_TABS.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="rnTab" data-t="${k}">${ic} ${l}${badge(k)}</button>`).join('')}</div>`;
    return band + tabs + (this.T[tab] || this.T.reino).call(this, ci, c, main, al);
  },
  // o que é da dinastia fica no reino principal; nos outros reinos, um aviso com o botão para ir até lá
  elsewhere(what) {
    const m = Reign.main();
    return `<div class="card rn-note"><div class="sec">👑 Na dinastia</div><p class="dt-desc">${what} valem para todos os seus reinos e ficam no reino principal, ${CIV_DEFS[m.id].short}.</p><div class="act-row"><button data-act="rnRole" data-k="k:${m.id}">${Heraldry.armsSvg(m.id, 14)} Abrir ${CIV_DEFS[m.id].short}</button></div></div>`;
  },
  have(c) { return k => k === 'gold' ? c.treasury : (c.stock[k] || 0); },
  // uma linha de obra, decreto ou ação: ícone, nome, texto, custo e botão
  it(ic, name, desc, right, cls) { return `<div class="rn-it ${cls || ''}"><span class="rn-ic">${ic}</span><span class="rn-t"><b>${name}</b><small>${desc}</small></span>${right}</div>`; },
  T: {
    // ---- Reino: o povo, os impostos, o que precisa de você, as lojas sem dono e a renúncia
    reino(ci, c, main, al) {
      const fc = Game.civForecast(c), wheatNet = fc.wheat - fc.need, vils = World.villages.filter(v => v && !v.free && v.civ === ci && !v.ruin).length;
      const stats = `<div class="card rn-stats"><div class="sec">📊 O reino <span>${UI.esc(CIV_DEFS[ci].desc)}</span></div><div class="rn-tiles">
          <div><small>População</small><b>${c.pop} / ${Game.popCap(c)}</b></div>
          <div><small>Trigo por mês</small><b class="${wheatNet < 0 ? 'bad' : 'ok'}">${wheatNet >= 0 ? '+' : ''}${wheatNet} 🌾</b></div>
          <div><small>Vilas do reino</small><b>${vils}</b></div></div>
        <div class="act-row"><button data-act="rboard" data-c="${ci}">📈 Painel do reino: o histórico mês a mês</button></div></div>`;
      const tax = `<div class="card rn-tax"><div class="sec">👪 Impostos <span>a renda e o soldo estão na aba Tesouro</span></div><div class="taxbox">
          <button data-act="tax" data-c="${ci}" data-d="-0.05" ${c.tax <= 0 ? 'disabled' : ''}>−5%</button><div class="val">${Math.round(c.tax * 100)}%</div>
          <button data-act="tax" data-c="${ci}" data-d="0.05" ${c.tax >= 0.5 ? 'disabled' : ''}>+5%</button>
          <div class="muted">Cada +5% rende ~${Math.round(c.pop * 0.1)} 🪙 a mais, mas reduz a felicidade em cerca de 8 pontos.</div></div></div>`;
      const att = `<div class="card rn-alerts"><div class="sec">⚠️ Atenção <span>${al.length ? al.length : 'nada pendente'}</span></div>${al.length ? `<div>${al.map(([ic, t, k]) => `<div class="rn-row"><span><b>${ic} ${UI.esc(t)}</b></span><span class="act-row"><button data-act="rnTab" data-t="${k}">Ver</button></span></div>`).join('')}</div>` : '<p class="ok">✔ Tudo em ordem no reino.</p>'}</div>`;
      const vac = UI.vacancyHtml(vi => { const v = World.villages[vi]; return v && !v.free && v.civ === ci && v.lord !== 'player'; });
      const h = Abdicate.heir(ci);
      const crown = `<div class="card rn-abd"><div class="sec">👑 Passar a coroa</div><p class="dt-desc">${UI.esc(h.p ? People.full(h.p) + ' (' + h.why + ')' : h.why)} assume o trono de ${CIV_DEFS[ci].short} e você vira Duque. O herdeiro escolhido fica em Corte → Herdeiros.</p>
        <div class="act-row"><button class="danger" data-act="abdicate" data-c="${ci}">👑 Renunciar ao trono</button></div></div>`;
      return stats + tax + att + vac + crown;
    },
    // ---- Tesouro: o mês inteiro (a conta de treasury.js), o histórico, bolso ⇄ tesouro, o banco, os armazéns e o dinheiro da dinastia
    tesouro(ci, c, main) {
      const f = Treasury.month(c), H = typeof Board !== 'undefined' ? Board.hist(ci).map(r => r.tre).slice(0, -1) : [];
      const months = Treasury.runway(c, f), opt = f.exp.filter(x => x[2]).reduce((a, x) => a + x[1], 0), max = Math.max(1, ...H, c.treasury);
      const fin = `<div class="card rn-fin"><div class="sec">📒 O mês do tesouro <span>estimativa da próxima virada do mês</span></div>
        <div class="fin-cols"><div><small class="fin-h">Entradas · +${f.tin} 🪙</small>${f.inc.map(([l, v]) => `<div class="fin-r"><span>${l}</span><b class="ok">+${v}</b></div>`).join('') || '<small class="muted">nenhuma</small>'}</div>
          <div><small class="fin-h">Saídas · −${f.tout} 🪙</small>${f.exp.map(([l, v, o]) => `<div class="fin-r"><span>${l}${o ? ' <small class="muted">(só com ouro)</small>' : ''}</span><b class="bad">−${v}</b></div>`).join('') || '<small class="muted">nenhuma</small>'}</div>
</div>
        ${H.length ? `<div class="rn-hist"><small>Tesouro nos últimos ${Math.min(12, H.length + 1)} meses</small><div class="fin-chart">${H.concat([c.treasury]).slice(-12).map((v, i, A) => `<i style="height:${Math.max(4, v / max * 100)}%" title="${v} 🪙" class="${i === A.length - 1 ? 'now' : ''}"></i>`).join('')}</div></div>` : ''}
        ${months !== null ? `<p class="bad">⚠️ ${months < 1 ? 'O tesouro não cobre as despesas deste mês' : `Neste ritmo, o tesouro acaba em ${months} ${months === 1 ? 'mês' : 'meses'}`}${opt ? `: aí ${f.exp.filter(x => x[2]).map(x => x[0].replace(/^\S+ /, '').toLowerCase()).join(', ')} param (−${opt} 🪙)` : ''}${f.netMust < 0 ? ' e o banco cobre o rombo do resto com dívida' : ''}.</p>` : '<p class="ok">✔ O tesouro está crescendo.</p>'}</div>`;
      const pocket = `<div class="rn-pocket"><div class="sec">💝 Seu bolso e o tesouro <span>você tem ${P.gold.toLocaleString('pt-BR')} 🪙</span></div>
        <div class="act-row">${[100, 1000, 5000].map(n => `<button data-act="kgold" data-c="${ci}" data-n="${n}" ${P.gold >= n ? '' : 'disabled'} title="Agrada o povo">Pôr ${n}</button>`).join('')}<button data-act="kgold" data-c="${ci}" data-n="all" ${P.gold > 0 ? '' : 'disabled'}>Pôr tudo</button>
          ${[100, 1000].map(n => `<button data-act="kgold" data-c="${ci}" data-n="-${n}" ${c.treasury >= n ? '' : 'disabled'} title="Desagrada o povo e as grandes casas">Tirar ${n}</button>`).join('')}<button data-act="kgold" data-c="${ci}" data-n="-all" ${c.treasury > 0 ? '' : 'disabled'}>Tirar tudo</button></div>
        <small class="muted">Pôr agrada o povo; tirar desagrada o povo e as grandes casas.</small></div>`;
      const fc = Game.civForecast(c);
      const store = `<div class="card rn-store"><div class="sec">📦 Armazéns do reino</div><div class="rn-res">${KINGDOM_RES.map(k => `<div class="rn-r"><span>${UI.ii(k)} ${ITEMS[k].name}</span><b>${c.stock[k] || 0}</b><small class="ok">+${fc.prod[k]}/mês</small><small>você: ${Inv.count(k)}</small>
          <span class="act-row"><button data-act="kres" data-c="${ci}" data-k="${k}" data-n="-10" ${(c.stock[k] || 0) >= 10 ? '' : 'disabled'} title="Retirar 10">−10</button><button data-act="kres" data-c="${ci}" data-k="${k}" data-n="10" ${Inv.count(k) >= 10 ? '' : 'disabled'} title="Depositar 10">+10</button></span></div>`).join('')}</div></div>`;
      return fin + Bank.kingCard(ci, pocket) + store + (main ? Reign.budgetHtml() : Reinado.elsewhere('O orçamento, a moeda e a alfândega'));
    },
    // ---- Leis e justiça: os decretos do reino, as leis, o tribunal e a prisão
    leis(ci, c) {
      const up = Crown.upkeep(c), esc = UI.esc.bind(UI);
      const decs = Object.entries(DECREES).map(([k, d]) => { const on = !!(c.decrees && c.decrees[k]), h = DECREE_HAPPY[k] || 0;
        return `<div class="law dec ${on ? 'on' : ''}"><b>${d.icon} ${esc(d.name)}</b><small>${esc(d.desc)}</small><div class="law-g"><i>${d.cost ? `🪙 ${d.cost}/mês` : 'sem custo'}</i>${h ? `<i class="${h > 0 ? 'ok' : 'bad'}">😊 ${h > 0 ? '+' : ''}${h}</i>` : ''}</div>
          <button class="${on ? '' : 'primary'}" data-act="cdec" data-c="${ci}" data-k="${k}">${on ? 'Revogar' : 'Decretar'}</button></div>`; }).join('');
      return `<div class="card law-box wide"><div class="sec">📜 Decretos de ${CIV_DEFS[ci].short} <span>${up ? `custam ${up} 🪙 por mês ao tesouro${c.decreeOff ? ' · <b class="bad">SUSPENSOS: falta ouro</b>' : ''}` : 'nenhum em vigor · cada um custa todo mês ao tesouro do reino'}</span></div><div class="law-grid">${decs}</div>
        <div class="sec law-sec">⚖️ Leis <span>${Laws.L().active.length}/${LAW_MAX} em vigor · valem em todos os seus reinos</span></div><div class="law-grid">${Laws.lawTiles()}</div></div>`
        + Laws.casesHtml() + Justice.page([ci]);
    },
    // ---- Conselho: o dilema, as quatro cadeiras, os complôs, quem trama e os espiões
    conselho(ci, c, main) {
      const S = UI.sel, esc = UI.esc.bind(UI);
      const seats = Object.keys(COUNCIL).map(seat => {
        const d = COUNCIL[seat], p = Court.member(ci, seat);
        let h = `<div class="rn-seat"><div class="rn-sh">${d.icon} ${d.m}${p && p.exposed ? ' <span class="bad">CORRUPTO</span>' : ''}</div>`;
        if (p) h += `<div class="rn-who"><b>${esc(People.full(p))}</b><small>${People.title(p)}, ${p.age} anos${Families.of(p) ? ' · Casa ' + esc(Families.of(p).surname) : ''}</small></div>
          <div class="rn-kv"><span>⭐ <b>${p.comp}</b> competência</span><span class="${p.aff < 15 ? 'bad' : p.aff > 50 ? 'ok' : ''}">💛 <b>${Math.round(p.aff)}</b> lealdade</span><span class="${(p.amb || 0) > 60 ? 'bad' : ''}">🔥 <b>${Math.round(Court.traits(p).amb || 0)}</b> ambição</span></div>`;
        else h += '<p class="muted">Cargo vago.</p>';
        h += `<small class="muted">${d.desc}</small>`;
        if (S.cseat === seat) h += `<div class="rn-cands">${Court.candidates(ci).slice(0, 4).map(q => `<div class="rn-row"><span><b>${esc(People.full(q))}</b><small>⭐ ${q.comp} · lealdade ${Math.round(q.aff)} · ${q.age} anos</small></span><span class="act-row"><button class="primary" data-act="appoint" data-c="${ci}" data-s="${seat}" data-id="${q.id}">Nomear</button></span></div>`).join('') || '<small class="muted">Ninguém disponível.</small>'}</div>`;
        h += `<div class="act-row">${p ? `<button data-act="tk" data-op="open" data-id="${p.id}">💬 Falar</button><button data-act="cdismiss" data-c="${ci}" data-s="${seat}">Dispensar</button>` : ''}${S.cseat === seat ? '' : `<button data-act="cpick" data-s="${seat}">${p ? 'Trocar' : 'Nomear alguém'}</button>`}</div></div>`;
        return h;
      }).join('');
      const council = `<div class="card rn-council"><div class="sec">🎩 O conselho de ${CIV_DEFS[ci].short} <span>competência ⭐, lealdade (a amizade com você) e ambição${c.stolen && Court.member(ci, 'spy') ? ` · desvios descobertos: ${c.stolen} 🪙` : ''}</span></div><div class="rn-seats">${seats}</div></div>`;
      return (main ? Reign.dilemmaHtml() + Reign.plotsHtml() : '') + council + (main ? Reign.spyHtml() : Reinado.elsewhere('Os dilemas, o julgamento dos complôs e os espiões'));
    },
    // ---- Vassalos e audiências: os feudos deste reino, as audiências e os cavaleiros
    vassalos(ci, c, main) {
      const kc = Crown.knightCandidates(ci), esc = UI.esc.bind(UI);
      const knights = `<div class="card rn-knights"><div class="sec">🗡️ Sagrar cavaleiros <span>150 🪙 do tesouro · os mais fortes do reino</span></div>${kc.slice(0, 4).map(p => `<div class="rn-row"><span><b>${p.sex === 'm' ? '🧔' : '👩'} ${esc(People.full(p))}</b><small>${People.title(p)}, ${p.age} anos · 💪 ${p.str} · ${esc(People.homeName(p))}</small></span>
        <span class="act-row"><button data-act="cknight" data-c="${ci}" data-id="${p.id}" ${c.treasury >= 150 ? '' : 'disabled'}>🗡️ Sagrar</button></span></div>`).join('') || '<p class="muted">Ninguém forte o bastante no reino agora.</p>'}</div>`;
      return (main ? Reign.audHtml() : '') + Reign.fiefsHtml(ci) + knights + (main ? '' : Reinado.elsewhere('As audiências'));
    },
    // ---- Diplomacia: uma linha por reino com a relação, a guerra e a paz, a aliança e os tratados
    diplo(ci, c, main) {
      const esc = UI.esc.bind(UI), R = Reign.R();
      const rows = G.civs.filter(o => o.id !== ci && !o.dead).map(o => {
        if (o.ruler === 'player') return `<div class="rn-dip mine"><span class="rn-dn">${Heraldry.armsSvg(o.id, 20)}<b>${CIV_DEFS[o.id].short}</b><small>seu reino</small></span></div>`;
        const r = Math.round(Diplo.rel(ci, o.id)), war = Diplo.atWar(ci, o.id), al = Diplo.allied(ci, o.id), pk = main ? Pacts.rowFor(o.id) : null;
        const tags = [war ? '<span class="badge">GUERRA</span>' : '', al ? '<span class="tag">ALIADO</span>' : '', o.overlord === ci ? '<span class="tag">👑 vassalo</span>' : '', main && R.claims[o.id] ? '<span class="tag">💍 direito ao trono</span>' : '', main && Reign.treaty(ci, o.id, 'nonagg') ? '<span class="tag">📜 não agressão</span>' : '', pk ? pk.tags : ''].join(' ');
        const acts = `<button data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="gift" ${c.treasury >= 100 ? '' : 'disabled'} title="+12 de relação">🎁 Presente 100</button>`
          + (war ? `<button class="danger" data-act="wbattle" data-c="${ci}" data-o="${o.id}">⚔️ Batalha</button><button data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="peace">📜 Mensageiro de paz</button>`
            : `<button data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="ally" ${!al && r >= 40 && c.treasury >= 200 ? '' : 'disabled'} title="Exige relação 40+">🤝 Aliança 200</button><button class="danger" data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="war">📜 Guerra</button>`)
          + (main ? Reign.diploActs(o) + pk.acts : '');
        return `<div class="rn-dip"><span class="rn-dn">${Heraldry.armsSvg(o.id, 20)}<b>${CIV_DEFS[o.id].short}</b><small>${esc(o.rulerName)}${main ? ' · ' + pk.power : ''}</small></span>
          <span class="rn-rel"><span class="pbar"><i style="left:50%;width:${Math.abs(r) / 2}%;${r < 0 ? 'transform:translateX(-100%);background:#c0392b' : 'background:#5fd35f'}"></i><em></em></span><b class="${r < 0 ? 'bad' : r >= 40 ? 'ok' : ''}">${r > 0 ? '+' : ''}${r}</b></span>
          <span class="act-row">${tags}${acts}</span></div>`;
      }).join('');
      return `<div class="card rn-dips wide"><div class="sec">🤝 ${CIV_DEFS[ci].short} e os outros reinos <span>relação entre reinos · os custos saem do tesouro${main ? ' · 📦 comércio por 12 meses (relação 15+) · 💰 tributo só de um reino bem mais fraco' : ''}</span></div>${rows}</div>`
        + (main ? Pacts.wedCard() + Pacts.hostCard() + Pacts.worldCard() : Reinado.elsewhere('Os tratados (casamento, comércio, tributo, reféns, não agressão e vassalagem)'));
    },
    // ---- Exército: a guarnição, a escolta, a tropa, os generais e os guardas do castelo
    exercito(ci, c, main) {
      const have = Reinado.have(c), capOk = Game.allies().length < Game.followerCap(), can = have('gold') >= 40 && have('wheat') >= 5 && c.garrison < Game.maxGarrison(c);
      const gar = `<div class="card rn-gar"><div class="sec">🛡️ Guarnição <span>${c.garrison}/${Game.maxGarrison(c)} soldados · ${Math.min(c.garrison, Garrison.FIELD)} pelo reino · ${Math.max(0, c.garrison - Garrison.FIELD)} de reserva</span></div>
        ${Reinado.it('🪖', 'Recrutar', `Cada soldado custa ${UI.fmtCost({ gold: 40, wheat: 5 }, have)}`, `<span class="act-row">${[1, 6].map(n => `<button class="primary" data-act="krecruit" data-c="${ci}" data-n="${n}" ${can ? '' : 'disabled'}>${n > 1 ? `Até ${n}` : '+1'}</button>`).join('')}</span>`)}
        ${Reinado.it('⚔️', 'Convocar escolta', `Um soldado passa a seguir você como capanga · seguidores ${Game.allies().length}/${Game.followerCap()}`, `<button class="primary" data-act="kescort" data-c="${ci}" ${c.garrison > 1 && capOk ? '' : 'disabled'}>Convocar</button>`)}</div>`;
      const guards = UI.guardsHtml({ kind: 'castle', civ: ci }) || `<div class="card rn-guards"><div class="sec">🛡️ Guardas no castelo</div><p class="muted">Converse com um capanga e escolha “Mandar fazer guarda”.</p></div>`;
      return gar + (main ? Reign.troopHtml() + Reign.generalsHtml() : '') + guards + (main ? '' : Reinado.elsewhere('A moral, o treino e os generais'));
    },
    // ---- Obras: investimentos, fronteiras, castelo e Grandes Obras (para casas, lojas e estradas: Construir)
    obras(ci, c) {
      const have = Reinado.have(c), fmt = cost => UI.fmtCost(cost, have);
      const inv = Object.entries(INVESTMENTS).map(([k, iv]) => { const ok = Object.entries(iv.cost).every(([r, n]) => have(r) >= n);
        return Reinado.it(iv.icon, `${iv.name} <i>nível ${c.invest[k]}</i>`, `${iv.desc}<span class="cost">${fmt(iv.cost)}</span>`, `<button class="primary" data-act="invest" data-c="${ci}" data-k="${k}" ${ok ? '' : 'disabled'}>Investir</button>`); }).join('');
      const lvl = Borders.lvl(ci), bmax = lvl >= BORDER_MAX, bcost = Borders.cost(ci), gain = bmax ? 0 : Borders.nextGain(ci), bok = !bmax && gain > 0 && Object.entries(bcost).every(([r, n]) => have(r) >= n);
      const border = Reinado.it('🗺️', `Expandir fronteiras <i>nível ${lvl}/${BORDER_MAX}</i>`, `${bmax ? 'As fronteiras já estão no máximo.' : gain ? `+${gain} blocos de terra selvagem para o reino.` : 'Não há terra selvagem na fronteira.'}${bmax ? '' : `<span class="cost">${fmt(bcost)}</span>`}`, `<button class="primary" data-act="kborder" data-c="${ci}" ${bok ? '' : 'disabled'}>Expandir</button>`);
      const works = Object.entries(WORKS).map(([k, w]) => { const st = Crown.work(c, k), part = Math.ceil(w.gold / w.months), pr = st ? Math.min(1, st.paid / w.months) : 0;
        return Reinado.it(w.icon, w.name, `${w.desc}${st && !st.done ? `<span class="cr-prog"><i style="width:${Math.round(pr * 100)}%"></i></span>${st.paid}/${w.months} parcelas${st.stalled ? ' · <b class="bad">parada: falta ouro</b>' : ''}` : ''}`,
          st && st.done ? '<span class="ok">✔ pronta</span>' : st ? `<span class="muted">${part} 🪙/mês</span>` : `<button class="primary" data-act="cwork" data-c="${ci}" data-k="${k}" ${c.treasury >= part ? '' : 'disabled'}>${w.months} × ${part} 🪙</button>`, st && st.done ? 'on' : ''); }).join('');
      return `<div class="card rn-inv wide"><div class="sec">🏗️ Obras do reino <span>pagas com o tesouro e os armazéns · casas, lojas e estradas: Construir → Reformas e Obras</span></div><div class="rn-grid3">${inv}${border}${Reign.castleHtml(ci)}</div></div>
        <div class="card rn-works wide"><div class="sec">🏛️ Grandes Obras reais <span>parcelas mensais · até duas ao mesmo tempo</span></div><div class="rn-grid3">${works}</div></div>`;
    },
    // ---- Corte: festas e cerimônias do reino; na dinastia, baile, bobo, herdeiros e crônica
    corte(ci, c, main) {
      const have = Reinado.have(c);
      const fest = Reinado.it('🎉', 'Festival', `Uma grande festa: +10 de felicidade agora e mais no próximo mês · ${UI.fmtCost({ gold: 100, wheat: 40 }, have)}`, `<button class="primary" data-act="kfest" data-c="${ci}" ${have('gold') >= 100 && have('wheat') >= 40 ? '' : 'disabled'}>Realizar</button>`);
      const acts = Object.entries(Crown.ACTIONS).map(([k, a]) => { const cd = Crown.cd(c, k), cant = cd || c.treasury < a.cost || (k === 'monumento' && (c.monument || 0) >= 3);
        return Reinado.it(a.icon, `${a.name}${k === 'monumento' && c.monument ? ` (${c.monument}/3)` : ''}`, `${a.desc}${a.cd ? ` · a cada ${a.cd} meses` : ''}`, `<button class="primary" data-act="cact" data-c="${ci}" data-k="${k}" ${cant ? 'disabled' : ''}>${cd ? `em ${cd} ${cd === 1 ? 'mês' : 'meses'}` : a.cost ? a.cost + ' 🪙' : 'Fazer'}</button>`); }).join('');
      return `<div class="card rn-acts wide"><div class="sec">👑 Festas e cerimônias de ${CIV_DEFS[ci].short} <span>pagas com o tesouro do reino${main ? ' · o baile e o bobo valem para a dinastia' : ''}</span></div><div class="rn-grid3">${fest}${acts}${main ? Reign.ballHtml() + Reign.jesterHtml() : ''}</div></div>`
        + (main ? Reign.heirsHtml() + Reign.chronHtml() : Reinado.elsewhere('O baile, o bobo, os herdeiros e a crônica'));
    },
    // ---- Brasão: a bandeira, o brasão, o nome e a cor do reino
    brasao(ci) {
      const d = CIV_DEFS[ci], esc = UI.esc.bind(UI);
      if (Heraldry.lead(ci) !== ci) {
        const L = Heraldry.lead(ci);
        return `<div class="card herald-prev wide"><div class="sec">Bandeira e brasão</div><div class="hp-row">${Heraldry.flagSvg(ci, 150, 100)}${Heraldry.armsSvg(ci, 92)}</div>
          <p class="dt-desc">${esc(d.name)} leva a bandeira e o brasão de <b>${esc(CIV_DEFS[L].name)}</b>, o seu reino principal. Os dois continuam reinos diferentes, com nomes e relações próprios.</p>
          <div class="act-row"><button data-act="hfollow" data-c="${ci}" data-v="0">🛡️ Usar bandeira e brasão próprios</button></div></div>`;
      }
      const hx = Heraldry.get(ci), pick = (k, v, inner, label, on) => `<button class="hpick ${on ? 'on' : ''}" data-act="hset" data-c="${ci}" data-k="${k}" data-v="${v}" title="${label}">${inner}<small>${label}</small></button>`;
      const lead = G.mainRealm !== null && G.mainRealm !== undefined && G.mainRealm !== ci && G.civs[G.mainRealm] && G.civs[G.mainRealm].ruler === 'player';
      return `<div class="card herald-prev"><div class="sec">Prévia <span>a bandeira tremula nas torres; o brasão fica sobre o portão</span></div>
          <div class="hp-row">${Heraldry.flagSvg(ci, 120, 80)}${Heraldry.armsSvg(ci, 76)}</div>
          <div class="act-row">${lead ? `<button data-act="hfollow" data-c="${ci}" data-v="1">🛡️ Usar a marca de ${esc(CIV_DEFS[G.mainRealm].short)}</button>` : ''}<button data-act="hreset" data-c="${ci}">↺ Voltar ao original</button></div></div>
        <div class="card rn-hname"><div class="sec">Nome e cores</div>
          <div class="cr-names"><label>Nome completo<input id="hName" maxlength="32" value="${esc(d.name)}"></label><label>Nome curto<input id="hShort" maxlength="14" value="${esc(d.short)}"></label></div>
          <div class="act-row"><button class="primary" data-act="hname" data-c="${ci}">✍️ Renomear o reino</button></div>
          <small class="muted">Cor do reino (fronteiras, mapa, guardas e telhados) e metal:</small>
          <div class="hswatch">${TINCTURES.map(([cl, n]) => `<button class="sw ${hx.color === cl ? 'on' : ''}" data-act="hset" data-c="${ci}" data-k="color" data-v="${cl}" title="${n}" style="background:${cl}"></button>`).join('')}</div>
          <div class="hswatch">${METALS.map(([cl, n]) => `<button class="sw ${hx.metal === cl ? 'on' : ''}" data-act="hset" data-c="${ci}" data-k="metal" data-v="${cl}" title="${n}" style="background:${cl}"></button>`).join('')}</div></div>
        <div class="card rn-hflag"><div class="sec">Bandeira</div><div class="hgrid">${FLAG_PATTERNS.map(([k, n]) => pick('flag', k, Heraldry.flagSvg(ci, 54, 36, { flag: k }), n, hx.flag === k)).join('')}</div></div>
        <div class="card rn-harms"><div class="sec">Brasão: divisão e símbolo</div><div class="hgrid">${ARMS_DIVISIONS.map(([k, n]) => pick('division', k, Heraldry.armsSvg(ci, 34, { division: k }), n, hx.division === k)).join('')}</div>
          <div class="hgrid">${CHARGES.map(ch => pick('charge', ch, Heraldry.armsSvg(ci, 30, { charge: ch }), '', hx.charge === ch)).join('')}</div></div>`;
    },
  },
  // ---------------------------------------------------------------- papel de governador
  village(vi) {
    const v = World.villages[vi], esc = UI.esc.bind(UI), res = People.residents(vi).length, f = VillageEcon.forecast(vi);
    const chip = (ic, label, val, cls) => `<span class="rg-chip ${cls || ''}"><i>${ic}</i><small>${label}</small><b>${val}</b></span>`;
    const raid = v.raid && v.raid.until >= G.day;
    const band = `<div class="rg-top rn-vband"><span class="rg-arms"><span class="rn-vic">🏘️</span></span><span class="rg-who"><b>${esc(v.name)}</b><small>${v.free ? 'Vila livre' : esc(CIV_DEFS[v.civ].name)} · você é o governador</small></span>
      ${chip('⭐', 'Nível', f.lvl)}${chip('👪', 'Moradores', `${res}/${Families.vcap(v)}`)}${chip('📈', 'Crescimento', (f.per >= 0 ? '+' : '−') + Math.abs(f.per).toFixed(2), f.per < 0 ? 'bad' : '')}${chip('🪙', 'Impostos/dia', res * Court.villageTax())}${raid ? chip('🔥', 'Alerta', 'saqueada', 'bad') : ''}</div>`;
    const annex = Borders.annexTarget(vi);
    const acts = `<div class="card rn-vacts"><div class="sec">🏛️ O governo da vila</div><p class="dt-desc">Como governador, use Construir → Reformas e Obras para mudar, demolir e erguer imóveis, estradas e muralhas dentro da vila.</p>
      <div class="act-row"><button class="primary" data-act="vbuild">🏗️ Construir obras na vila</button><button data-act="vping" data-v="${vi}">📍 Marcar no mapa</button>${annex >= 0 ? `<button class="primary" data-act="vannex" data-v="${vi}" title="A vila entra no seu reino com a terra em volta">👑 Anexar ao ${esc(CIV_DEFS[annex].short)}</button>` : ''}<button class="danger" data-act="nbLeaveV" data-v="${vi}">Deixar o governo</button></div></div>`;
    const guards = UI.guardsHtml({ kind: 'village', vi }) || '';
    return band + VillageAdmin.cards(vi) + Politics.villageCard(vi) + guards + UI.vacancyHtml(x => x === vi) + acts;
  },
  // ---------------------------------------------------------------- Títulos e corte (o visual da antiga Coroa e títulos)
  titles() {
    const S = UI.sel, tab = RN_TIT.some(t => t[0] === S.crTab) ? S.crTab : 'titulos';
    const tabs = `<div class="tabs subtabs cr-tabs">${RN_TIT.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="crtab" data-t="${k}">${ic} ${l}</button>`).join('')}</div>`;
    let body;
    if (tab === 'titulos') {
      const t = document.createElement('template'); t.innerHTML = UI.titlesPairHtml();
      const cards = t.content.querySelectorAll('.tpair > .card'), T0 = Court.T(), nx = NOBLE_TITLES[Math.max(-1, T0.lvl) + 1], fem = P.sex === 'f', held = Court.titledCivs();
      // as vantagens aparecem conforme os títulos são conquistados (um por reino, cada um com as suas e a renúncia dele)
      if (held.length && cards[0]) { const tl = cards[0].querySelector('.tlist'); if (tl) tl.remove(); }
      if (cards[0] && held.length) cards[0].insertAdjacentHTML('beforeend', `<div class="cr-adv"><div class="cr-next-h">Suas vantagens</div>${held.map(ci => { const l = Court.levelIn(ci);
        return `<div class="cr-adv-t"><div class="cr-adv-h"><b>${NOBLE_TITLES[l].icon} ${UI.esc(Court.titleName(l, ci))}</b><button class="danger" data-act="nbLeaveT" data-c="${ci}">Renunciar</button></div><div class="cr-reqs">${Nobility.lines(l).map(x => `<span>${x}</span>`).join('')}</div></div>`; }).join('')}</div>`);
      if (cards[0]) cards[0].insertAdjacentHTML('beforeend', nx ? `<div class="cr-next"><div class="cr-next-h">Próximo: <b>${nx.icon} ${fem ? nx.f : nx.m}</b> <small>peça no castelo de um reino</small></div>
        <div class="cr-reqs"><span>🤝 relação com o reino <b>${nx.rel}+</b></span><span>📜 serviços à coroa <b>${nx.serv}+</b></span>
        <span class="${P.level >= nx.lvl ? 'ok' : ''}">⭐ nível <b>${nx.lvl}+</b> ${P.level >= nx.lvl ? '✓' : `(você: ${P.level})`}</span>${nx.fee ? `<span class="${P.gold >= nx.fee ? 'ok' : ''}">🪙 taxa <b>${nx.fee}</b></span>` : ''}</div>
        <small class="muted">${nx.perks}</small></div>` : '<div class="cr-next"><div class="cr-next-h">Você chegou ao título mais alto.</div></div>');
      if (cards[1]) cards[1].insertAdjacentHTML('beforeend', `<div class="cr-civ">${CIVIL_TITLES.map(ct => `<div class="${Court.hasCivil(ct.id) ? 'got' : ''}"><span>${ct.icon}</span><b>${Court.civilName(ct)}</b><small>${ct.req}</small><em>${Court.hasCivil(ct.id) ? '✓' : ''}</em></div>`).join('')}</div>`);
      body = `<div class="cr-page cr-tit">${t.innerHTML}</div>`;
    } else if (tab === 'corte') body = `<div class="cr-page cr-2"><div class="cr-col">${UI.courtInvHtml()}</div><div class="cr-col">${UI.relCardHtml()}</div></div>`;
    else if (tab === 'vilas') body = `<div class="cr-page cr-soc cr-vil">${UI.villageWaysHtml()}${UI.guardsHtml('away')}</div>`;
    else body = `<div class="cr-page cr-soc">${UIP.capture(() => UIP._raw.society(UI.sel.socTab))}</div>`;
    return tabs + body;
  },
};

{
  // a página x:reign do Portfólio
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { if (nav === 'x:reign') return Reinado.page(); return kp0(nav); };
  // a arrumação: papel de rei e de governador em páginas (quadros dois a dois); Títulos e corte com o visual de antes
  const fr0 = UI.fitReino.bind(UI);
  UI.fitReino = function (nav, pkey) {
    const nv = nav || this.sel.knav || '';
    if (nv !== 'x:reign') return fr0(nav, pkey);
    const role = Reinado.role();
    if (role === 't') { const r = fr0('crown', 'rn/t/' + (this.sel.crTab || 'titulos')); try { Portfolio.paginate(); } catch (e) { console.error(e); } return r; }
    return fr0('x:reign', 'rn/' + role + '/' + (role.startsWith('k:') ? this.sel.rnTab : ''));
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'rnRole') { this.sel.rnRole = d.k; this.sel.cseat = null; Reinado.refresh(); return; }
    if (a === 'rnTab') { this.sel.rnTab = d.t; this.sel.cseat = null; Reinado.refresh(); return; }
    return a0(a, d);
  };
}
