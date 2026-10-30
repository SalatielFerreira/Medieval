'use strict';
// Janelas mais úteis e organizadas:
//  1. Central de avisos: um sino no HUD com tudo o que precisa de você (prazos, dilemas, convites, perigos), e um
//     botão que leva direto à janela certa.
//  2. Ficha do item: para que serve, onde conseguir, onde vende melhor, quem gosta e o que faz.
//  3. Finanças do reino: entradas, saídas, saldo, quantos meses o tesouro aguenta, histórico e riscos.
//  4. Oficinas: quanto vale o que você faz contra o custo dos ingredientes.
//  5. Construção: quanto rende por mês, em quantos meses se paga e o que consome.
//  6. Conversa: amizade com a barra até o próximo nível e o benefício, o que a pessoa quer agora e o resto organizado.
//  7. Mapa com camadas: seus negócios, favoritos, guerras, religiões, feiras e leilões, feudos.
//  8. Conselho de guerra: chance estimada de vitória e o que se ganha e perde.
//  9. Portfólio → Gestão: Avisos, Finanças, Negócios, Sociedade e Reinado como páginas do menu lateral.

const UIP = {
  // ---------------------------------------------------------------- utilidades
  capture(fn) { const o = UI.open; let body = ''; UI.open = (t, b) => { body = b; }; try { fn(); } finally { UI.open = o; } return body; },
  inPortfolio(k) { return UI.cur && UI.cur.fn === 'showKingdom' && UI.sel.knav === k; },
  money(n) { return `${n > 0 ? '+' : ''}${Math.round(n)} 🪙`; },
  // ---------------------------------------------------------------- 1. avisos
  alerts() {
    const out = [], add = (ic, text, go, urg, when) => out.push({ ic, text, go, urg: urg || 1, when });
    if (G.warCall) add('⚔️', `${G.warCall.own ? 'Guerra contra' : 'Pedido de ajuda contra'} ${CIV_DEFS[G.warCall.enemy].short}: monte o exército no Conselho de Guerra.`, () => UI.showWarCouncil(), 3, G.warCall.deadline ? `${Math.max(0, Math.ceil(G.warCall.deadline - G.realTime))} s` : '');
    for (const [txt, k] of UI.kAlerts()) add('⚠️', txt, () => { UI.sel.knav = k; UI.showKingdom(); }, 2);
    if (typeof Reign !== 'undefined' && Reign.isKing()) {
      const R = Reign.R();
      if (R.dilemma) add('📜', 'O conselho real espera a sua decisão sobre um dilema.', () => UIP.goPage('x:reign', 'council'), 2, 'até o fim do mês');
      if (R.aud.length) add('⚖️', `${R.aud.length} súdito(s) pedem audiência.`, () => UIP.goPage('x:reign', 'aud'), 1, 'este mês');
      for (const p of R.plots.filter(x => x.found)) add('🗡️', `Complô descoberto: ${G.people[p.pid] ? G.people[p.pid].name : '?'} ${Reign.PLOT_TXT[p.kind]}.`, () => UIP.goPage('x:reign', 'spy'), 3);
      for (const [vi, f] of Object.entries(R.fiefs)) { if (f.rebel) add('🏴', `Revolta do barão de ${World.villages[vi].name}: negocie ou esmague (${3 - (f.rebelMonths || 0)} mês(es)).`, () => UIP.goPage('x:reign', 'fiefs'), 3); else if (f.loyal < 25) add('🏰', `O barão de ${World.villages[vi].name} está insatisfeito (lealdade ${Math.round(f.loyal)}).`, () => UIP.goPage('x:reign', 'fiefs'), 2); }
      if (typeof Laws !== 'undefined' && Laws.L().cases.length) add('⚖️', `${Laws.L().cases.length} caso(s) esperando julgamento no tribunal.`, () => UIP.goPage('x:reign', 'law'), Laws.L().cases.some(c => G.day - c.day >= 2) ? 2 : 1, 'até 3 meses');
      if (R.army.morale < 30) add('🏃', `A moral da tropa está baixa (${Math.round(R.army.morale)}): soldados podem desertar.`, () => UIP.goPage('x:reign', 'army'), 2);
    }
    if (typeof Society !== 'undefined') {
      const S = Society.S();
      for (const i of S.invites) { const p = G.people[i.pid]; add('💌', `${p ? p.name : '?'} convida você para ${i.name} em ${World.villages[i.vi].name}.`, () => UIP.goPage('x:society', 'events'), 1, `até ${Calendar.short(i.until)}`); }
      const sp = Society.spouse(); if (sp && sp.rom < 45) add('💔', `${sp.name} sente a sua falta (romance ${Math.round(sp.rom)}).`, () => UI.showTalk(sp.id), 2);
      for (const p of G.people.filter(q => q.alive && q.lent)) add('💸', `Você deve ${p.lent} 🪙 a ${p.name} (amizade em risco).`, () => UI.showTalk(p.id), G.day - (p.lentDay || 0) >= 5 ? 2 : 1);
      for (const [vi, E] of Object.entries(S.elect)) if (E.tie) add('⚖️', `Empate na eleição de ${World.villages[vi].name}: você decide quem governa.`, () => UIP.goPage('x:society', 'politics'), 3, `até ${Calendar.short(E.tie.day + 1)}`);
      for (const [vi, E] of Object.entries(S.elect)) if (E.me && !E.tie) add('🗳️', `Você é candidato em ${World.villages[vi].name}: eleição em ${Calendar.short(E.next)}.`, () => UIP.goPage('x:society', 'politics'), 1);
      const rv = Society.rivals(); if (rv.length) add('⚔️', `${rv.length} rival(is) podem desafiar você para um duelo.`, () => UIP.goPage('x:society', 'friends'), 1);
    }
    if (typeof Commerce !== 'undefined') {
      for (const k of Commerce.mine()) add('📜', `Encomenda: ${k.n} ${ITEMS[k.item].name} para ${k.from}.`, () => UIP.goPage('x:board', 'contracts'), k.due - G.day <= 1 ? 3 : 1, `até ${Calendar.short(k.due)}`);
      for (const s of Biz.list()) { if (s.strike > G.day) add('✊', `Greve no seu ${BUILDINGS[s.type].name}.`, () => UIP.goPage('x:board', 'biz'), 3); else if (Commerce.cond(s) < 50) add('🏚️', `${BUILDINGS[s.type].name} precisa de conserto (${Commerce.cond(s)}%).`, () => UIP.goPage('x:board', 'biz'), 1); }
      const a = Commerce.auction(); if (a && a.mine) add('🔨', `Seu lance de ${a.mine} 🪙 por ${ITEMS[a.item].name} (leilão em ${CIV_DEFS[a.ci].short}).`, () => UIP.goPage('x:board', 'market'), 1);
    }
    if (typeof Loans !== 'undefined') for (const l of Loans.L().filter(x => x.left > 0 && x.missed > 0)) add('🧾', `Parcela atrasada com ${Loans.lenderName(l)} (${l.missed}ª vez): pague antes que mandem cobradores.`, () => UI.showLoans(l.kind, l.ci, l.pid), 3);
    if (typeof Crime !== 'undefined') for (const ci in Crime.W()) { const w = Crime.wanted(+ci); if (w) add('⚖️', `Você é procurado em ${CIV_DEFS[ci].short} (multa ${w.bounty} 🪙)${w.resist ? ': os guardas atacam' : ''}.`, null, w.resist ? 3 : 2); }
    if (typeof Games !== 'undefined' && Games.S().on && Object.keys(Games.S().me).length < 3) add('🏅', `Jogos dos Sete Reinos em ${Games.hostName()}: vá à arena competir.`, () => UIP.goPage('x:games'), 1, `até ${Calendar.short(Games.S().day + 1)}`);
    if (typeof Mercs !== 'undefined') for (const d of MERC_CO) { const c = Mercs.co(d.id); if (c.emp === 'player' && c.unpaid) add(d.icon, `${d.name} está sem soldo (${c.unpaid} mês): pague ou ela troca de lado.`, () => UIP.goPage('x:merc'), 3); }
    if (P.hunger < 20) add('🍖', 'Você está com fome: coma algo.', () => UI.showInventory(), 2);
    return out.sort((a, b) => b.urg - a.urg);
  },
  goPage(k, tab) {
    if (k === 'x:reign') UI.sel.rgTab = tab; if (k === 'x:society') UI.sel.socTab = tab; if (k === 'x:board') UI.sel.bbTab = tab;
    UI.sel.knav = k; UI.showKingdom();
  },
  alertsPage() {
    const L = this.alerts(); this.lastAlerts = L;
    return UI.pageHead('🔔', 'Avisos', L.length ? `${L.length} coisa(s) precisam de você` : 'Tudo em ordem')
      + (L.length ? `<div class="card al-list">${L.map((a, i) => `<div class="al-row u${a.urg}"><span class="al-ic">${a.ic}</span><span class="al-t">${UI.esc(a.text)}${a.when ? `<small>⏳ ${UI.esc(a.when)}</small>` : ''}</span>${a.go ? `<button data-act="alGo" data-i="${i}">Ir</button>` : ''}</div>`).join('')}</div>`
        : '<div class="card kalone"><div class="dy-empty"><span>🕊️</span><b>Nada pendente</b><small>Prazos, convites, dilemas e perigos aparecem aqui (e no sino ao lado do seu retrato).</small></div></div>');
  },
  bell() {
    let el = document.getElementById('alertBell');
    if (!el) { el = document.createElement('button'); el.id = 'alertBell'; el.className = 'al-bell'; el.title = 'Avisos'; el.addEventListener('click', () => { if (G.state === 'play') UIP.goPage('x:alerts'); }); document.body.appendChild(el); }
    if (G.state !== 'play' || G.place && G.place.kind === 'battle' || UI.isOpen()) { el.classList.add('hidden'); return; } // só na tela do jogo
    const L = this.alerts(), urg = L.some(a => a.urg >= 3);
    el.classList.toggle('hidden', !L.length); el.classList.toggle('urg', urg);
    const t = `🔔<b>${L.length}</b>`; if (el.innerHTML !== t) el.innerHTML = t;
  },
  // ---------------------------------------------------------------- 2. ficha do item
  sources(k) {
    const out = [], it = ITEMS[k]; if (!it) return out;
    const objs = [...new Set(OBJ.filter(o => o && o.drops && o.drops[k]).map(o => o.name))];
    if (typeof NODE_EXTRA !== 'undefined') for (const [t, ex] of Object.entries(NODE_EXTRA)) if (ex[k] && OBJ[t]) objs.push(`${OBJ[t].name} (às vezes)`);
    if (objs.length) out.push(['🌳', 'Na natureza', [...new Set(objs)].join(', ')]);
    const mobs = Object.values(CREATURES).filter(c => c.drops && c.drops[k]).map(c => c.name); if (mobs.length) out.push(['🏹', 'Caça e monstros', mobs.join(', ')]);
    if (it.fish || ['seashell', 'seaweed', 'mussels', 'goldfish', 'old_boot'].includes(k)) out.push(['🎣', 'Pesca', it.fish ? 'vara de pesca na água' : 'no mar, junto com os peixes']);
    const crop = Object.values(CROPS).find(c => c.item === k); if (crop) out.push(['🌱', 'Lavoura', `plante ${ITEMS[crop.seed] ? ITEMS[crop.seed].name : 'sementes'} com a enxada`]);
    const farms = Object.entries(BUILDINGS).filter(([b]) => typeof EXPB !== 'undefined' && EXPB[b] && EXPB[b].fn.farm && EXPB[b].fn.farm[k]).map(([, b]) => b.name);
    const animal = { egg: 'Galinheiro', milk: 'Curral (vacas)', wool: 'Curral (ovelhas)', honey: 'Colmeia' }[k]; if (animal) farms.push(animal);
    if (farms.length) out.push(['🐄', 'Criações e obras', farms.join(', ')]);
    const biz = Object.entries(BIZ_TYPES).filter(([, d]) => d.out && d.out[k]).map(([b]) => BUILDINGS[b] ? BUILDINGS[b].name : b); if (biz.length) out.push(['💼', 'Empreendimentos', biz.join(', ')]);
    const rec = RECIPES.filter(r => r.out === k).map(r => r.station ? STATIONS[r.station].name.split(' /')[0] : 'à mão'); if (rec.length) out.push(['🔨', 'Fabricar', [...new Set(rec)].join(', ')]);
    const shops = Object.values(SHOPS).filter(s => (s.sells || []).includes(k)).map(s => s.name); if (shops.length) out.push(['🏪', 'Lojas', [...new Set(shops)].join(', ')]);
    return out;
  },
  uses(k) {
    const out = [];
    const rec = RECIPES.filter(r => r.cost[k] || (k === 'trout' || k === 'carp' || k === 'sardine' || k === 'cod') && r.cost.fish).map(r => r.out);
    if (rec.length) out.push(['🔨', 'Ingrediente de', [...new Set(rec)].slice(0, 14).map(o => ITEMS[o].name).join(', ') + (rec.length > 14 ? ` e mais ${rec.length - 14}` : '')]);
    const bl = Object.entries(BUILDINGS).filter(([, b]) => b.cost && b.cost[k]).map(([, b]) => b.name); if (bl.length) out.push(['🏗️', 'Construções', bl.slice(0, 10).join(', ') + (bl.length > 10 ? ` e mais ${bl.length - 10}` : '')]);
    if (typeof BIZ_INPUTS !== 'undefined') { const bi = Object.entries(BIZ_INPUTS).filter(([, d]) => d[k]).map(([b]) => BUILDINGS[b] ? BUILDINGS[b].name : b); if (bi.length) out.push(['💼', 'Insumo de', bi.join(', ')]); }
    return out;
  },
  effect(it) {
    const e = [];
    if (it.food || it.heal) e.push(`${it.food ? `+${it.food} fome` : ''}${it.food && it.heal ? ', ' : ''}${it.heal ? `+${it.heal} vida` : ''}`);
    if (it.buff && BUFFS[it.buff]) e.push(`efeito: ${BUFFS[it.buff].name || it.buff}`);
    if (it.stamina) e.push('energia cheia');
    if (it.dmg) e.push(`dano ${it.dmg}${it.ranged ? ' (à distância)' : ''}${it.magic ? ' · mágico: gasta energia' : ''}`);
    if (it.def) e.push(`defesa ${it.def}${it.block ? ` · bloqueio ${Math.round(it.block * 100)}%` : ''}`);
    if (it.magicB) e.push(`magia +${Math.round(it.magicB * 100)}%`); if (it.rangedB) e.push(`arco +${Math.round(it.rangedB * 100)}%`); if (it.holyB) e.push(`contra mortos-vivos +${Math.round(it.holyB * 100)}%`); if (it.charm) e.push(`carisma +${it.charm}`);
    if (it.tool) e.push(`ferramenta: ${TOOL_NAMES[it.tool] || it.tool} (nível ${it.tier})`);
    const perks = { sickle: 'colheita maior', shears: 'tosquia as ovelhas', skin: 'mais couro e peles na caça', net: 'peixe a mais na pesca', lantern: 'luz à noite', spyglass: 'enxergar longe', lockpick: 'furtar melhor', builder: 'construções 15% mais baratas', saw: '+1 na serraria e carpintaria', tongs: 'chance de peça extra na forja', pitchfork: '+20% ao recolher as criações', compass: 'orientação', torch: 'luz e espanta lobos', trap: 'caça sozinha todo mês', bellows: 'economiza carvão', pestle: 'chance de poção extra' };
    if (it.perk) e.push(`na mochila: ${perks[it.perk] || it.perk}`);
    if (it.use) e.push('use pelo inventário');
    if (it.seed) e.push('semente: plante com a enxada');
    if (it.ammo) e.push('munição');
    return e;
  },
  itemPage(k) {
    const it = ITEMS[k]; if (!it) return '';
    const prices = G.civs.map((c, ci) => ({ ci, v: Game.price(ci, k).sell })).sort((a, b) => b.v - a.v);
    const likes = typeof CULTURES !== 'undefined' ? CULTURES.map((c, ci) => c.likes.includes(k) && CIV_DEFS[ci] ? `${c.icon} ${c.people}` : null).filter(Boolean) : [];
    const lovers = G.people.filter(p => p.alive && p.fav === k && p.known && p.known.fav).slice(0, 4).map(p => p.name);
    const sec = (t, rows) => rows.length ? `<div class="card ii-sec"><div class="sec">${t}</div>${rows.map(([ic, l, v]) => `<div class="ii-row"><span>${ic}</span><span><b>${l}:</b> ${UI.esc(v)}</span></div>`).join('')}</div>` : '';
    const eff = this.effect(it);
    return `<div class="ii-head"><div class="ii-big">${UI.ii(it)}</div><div><b>${UI.esc(it.name)}</b><small>${it.cat} · ${it.price} 🪙 de base · peso ${itemWeight(k)} · você tem ${Inv.count(k)}</small>${eff.length ? `<div class="ii-eff">${eff.map(x => `<span>${UI.esc(x)}</span>`).join('')}</div>` : ''}</div></div>
      <div class="ii-grid">${sec('🧭 Onde conseguir', this.sources(k)) || '<div class="card ii-sec"><div class="sec">🧭 Onde conseguir</div><p class="muted">Recompensas e comércio.</p></div>'}
      ${sec('🛠️ Para que serve', this.uses(k)) || '<div class="card ii-sec"><div class="sec">🛠️ Para que serve</div><p class="muted">Vender, presentear ou guardar.</p></div>'}
      <div class="card ii-sec"><div class="sec">💰 Onde vende melhor</div>${prices.slice(0, 3).map((x, i) => `<div class="ii-row"><span>${['🥇', '🥈', '🥉'][i]}</span><span><b>${CIV_DEFS[x.ci].short}:</b> ${x.v} 🪙${Market.trend(x.ci, k) === 'up' ? ' ▲' : Market.trend(x.ci, k) === 'down' ? ' ▼' : ''}</span></div>`).join('')}<small class="muted">Pior preço: ${CIV_DEFS[prices[prices.length - 1].ci].short} (${prices[prices.length - 1].v} 🪙). Vender muito num reino derruba o preço lá.</small></div>
      <div class="card ii-sec"><div class="sec">💝 Quem gosta</div><p class="dt-desc">${likes.length ? `Os ${likes.join(', ')} pagam 25% a mais e adoram ganhar de presente.` : 'Nenhum povo em especial.'}${GIFTABLE.includes(k) ? ' É um bom presente.' : ''}${lovers.length ? ` Favorito de: ${lovers.join(', ')}.` : ''}</p></div></div>`;
  },
  showItem(k) { UI.open(`📖 ${ITEMS[k] ? ITEMS[k].name : ''}`, `<div class="iinfo">${this.itemPage(k)}</div>`, 'showItemInfo', [k], 'Ficha do item'); },
  // ---------------------------------------------------------------- 3. finanças do reino
  finance(c) {
    const fc = Game.civForecast(c), inc = [], exp = [], R = typeof Reign !== 'undefined' ? Reign.R() : null, main = R && Reign.main() === c;
    inc.push(['👪 Impostos', fc.income]);
    if (R) {
      const fief = Object.entries(R.fiefs).filter(([vi, f]) => !f.rebel && World.villages[vi] && World.villages[vi].civ === c.id).reduce((a, [vi]) => a + Reign.tribute(+vi), 0); if (fief) inc.push(['🏰 Tributo dos feudos', fief]);
      const vas = G.civs.filter(v => v.overlord === c.id && v.ruler !== 'player').reduce((a, v) => a + Math.round(v.treasury * 0.1), 0); if (vas) inc.push(['👑 Reinos vassalos', vas]);
      if (main) { const tr = R.treaties.reduce((a, t) => a + Math.round(fc.income * (t.kind === 'commerce' ? 0.05 : t.kind === 'passage' ? 0.03 : 0)), 0); if (tr) inc.push(['📜 Tratados', tr]); if (R.customs) inc.push(['🛃 Alfândega', Math.round(R.customs / 100 * (Reign.realms().reduce((a, x) => a + x.pop, 0) * 0.4 + (G.caravans || []).length * 25))]); }
    }
    exp.push(['⚔️ Soldo da guarnição', fc.upkeep]);
    if (typeof Crown !== 'undefined' && Crown.upkeep(c)) exp.push(['📜 Decretos', Crown.upkeep(c)]);
    if (R && main) { exp.push(['📊 Orçamento (exército, corte, obras, igreja)', Reign.budgetCost()]); if (R.debt) exp.push(['🏦 Dívida com banqueiros', Math.min(60, R.debt)]); if (R.court.jester) exp.push(['🃏 Bobo da corte', 15]); }
    const tin = inc.reduce((a, x) => a + x[1], 0), tout = exp.reduce((a, x) => a + x[1], 0);
    return { inc, exp, tin, tout, net: tin - tout, fc };
  },
  financePage() {
    const ruled = G.civs.filter(c => c.ruler === 'player');
    if (!ruled.length) return UI.pageHead('💰', 'Finanças do reino', 'Você ainda não governa um reino') + '<div class="card kalone"><p class="muted">Quando governar um reino, as contas aparecem aqui.</p></div>';
    let h = UI.pageHead('💰', 'Finanças do reino', 'Entradas, saídas e o que vem pela frente (estimativa do mês)');
    for (const c of ruled) {
      const f = this.finance(c), H = (typeof Reign !== 'undefined' && Reign.R().hist && Reign.R().hist[c.id]) || [];
      const months = f.net < 0 ? Math.floor(c.treasury / -f.net) : null;
      const risks = [];
      if (f.fc.wheat < f.fc.need) risks.push('🌾 falta trigo: o povo vai passar fome');
      if (c.happy < 40) risks.push(`😠 felicidade ${Math.round(c.happy)}: risco de revolta`);
      if (c.inflation) risks.push('📈 inflação: tudo mais caro');
      if (Diplo.warsOf(c.id).length) risks.push(`⚔️ em guerra com ${Diplo.warsOf(c.id).map(w => CIV_DEFS[w.a === c.id ? w.b : w.a].short).join(', ')}`);
      if (c.garrison < 6) risks.push(`🛡️ guarnição fraca (${c.garrison})`);
      const max = Math.max(1, ...H, c.treasury);
      h += `<div class="card fin-card"><div class="sec">${Heraldry.armsSvg(c.id, 16)} ${CIV_DEFS[c.id].name} <span>tesouro ${c.treasury} 🪙 · ${f.net >= 0 ? `<b class="ok">${this.money(f.net)}/mês</b>` : `<b class="bad">${this.money(f.net)}/mês</b>`}</span></div>
        <div class="fin-cols"><div><small class="fin-h">Entradas · ${this.money(f.tin)}</small>${f.inc.map(([l, v]) => `<div class="fin-r"><span>${l}</span><b class="ok">+${v}</b></div>`).join('')}</div>
          <div><small class="fin-h">Saídas · −${f.tout} 🪙</small>${f.exp.map(([l, v]) => `<div class="fin-r"><span>${l}</span><b class="bad">−${v}</b></div>`).join('')}</div></div>
        ${months !== null ? `<p class="bad">⚠️ ${months < 1 ? 'O tesouro já não cobre as despesas: as dívidas vão crescer.' : `Neste ritmo, o tesouro acaba em ${months} ${months === 1 ? 'mês' : 'meses'}.`}</p>` : '<p class="ok">✔ O tesouro está crescendo.</p>'}
        ${H.length ? `<div class="fin-chart">${H.concat([c.treasury]).slice(-12).map((v, i, A) => `<i style="height:${Math.max(4, v / max * 100)}%" title="${v} 🪙" class="${i === A.length - 1 ? 'now' : ''}"></i>`).join('')}</div><small class="muted">Tesouro nos últimos ${Math.min(12, H.length + 1)} meses</small>` : ''}
        ${risks.length ? `<div class="fin-risk">${risks.map(r => `<span>${r}</span>`).join('')}</div>` : ''}
        <div class="act-row"><button data-act="knav" data-k="k:${c.id}">Administrar ${CIV_DEFS[c.id].short}</button>${typeof Reign !== 'undefined' ? '<button data-act="alPage" data-k="x:reign" data-t="money">📊 Orçamento, moeda e alfândega</button>' : ''}</div></div>`;
    }
    return h;
  },
  // ---------------------------------------------------------------- 5. o que uma construção rende
  // lucro estimado de um empreendimento por mês (2 funcionários): produção vendida − salários − insumos
  bizProfit(k) {
    const d = BIZ_TYPES[k], B = BUILDINGS[k]; if (!d) return null;
    const out = d.out || {}, gross = Object.entries(out).reduce((a, [i, n]) => a + (ITEMS[i] ? ITEMS[i].price * n * 0.6 : 0), 0) * 2 + (d.gold || 0) * 2 * 1.3;
    const wages = d.slots * d.wage, inputs = typeof BIZ_INPUTS !== 'undefined' && BIZ_INPUTS[k] ? Object.entries(BIZ_INPUTS[k]).reduce((a, [i, n]) => a + ITEMS[i].price * n * 2 * 0.8, 0) : 0;
    const net = Math.round(gross - wages - inputs), val = B ? Order.costValue(B.cost) : 0;
    return { wages, inputs, net, months: net > 0 ? Math.max(1, Math.ceil(val / net)) : null };
  },
  buildYield(k) {
    const B = BUILDINGS[k]; if (!B) return '';
    const val = Order.costValue(B.cost), rows = [];
    const ex = typeof EXPB !== 'undefined' && EXPB[k] ? EXPB[k].fn : null;
    if (BIZ_TYPES[k]) {
      const d = BIZ_TYPES[k], out = d.out || {}, { wages, inputs, net } = this.bizProfit(k);
      rows.push(['📦', 'Produz', Object.entries(out).map(([i, n]) => `${n * 2} ${ITEMS[i] ? ITEMS[i].name : i}`).join(', ') + (d.gold ? `${Object.keys(out).length ? ' · ' : ''}~${Math.round(d.gold * 2.6)} 🪙 de serviço` : '') + ' por mês (2 funcionários)']);
      if (inputs) rows.push(['🧺', 'Consome', Object.entries(BIZ_INPUTS[k]).map(([i, n]) => `${n * 2} ${ITEMS[i].name}`).join(', ') + ` (~${Math.round(inputs)} 🪙)`]);
      rows.push(['👷', 'Salários', `${wages} 🪙 por mês`]);
      rows.push([net > 0 ? '📈' : '📉', 'Lucro estimado', `${net} 🪙 por mês${net > 0 ? ` · se paga em ~${Math.max(1, Math.ceil(val / net))} meses` : ''}`]);
    } else if (ex && ex.farm) { const v = Object.entries(ex.farm).reduce((a, [i, n]) => a + (ITEMS[i] ? ITEMS[i].price * n : 0), 0); rows.push(['🐄', 'Produz', Object.entries(ex.farm).map(([i, n]) => `${n} ${ITEMS[i] ? ITEMS[i].name : i}`).join(', ') + ` por mês (~${Math.round(v)} 🪙)${ex.season ? ' · parado no inverno' : ''}`]); if (v > 0) rows.push(['📈', 'Se paga em', `~${Math.max(1, Math.ceil(val / v))} meses`]); }
    else if (ex && ex.home !== undefined) { rows.push(['🏠', 'Moradia', `+${ex.home} seguidores · aluguel ${ex.rent} 🪙/mês se alugar${ex.fame ? ` · +${ex.fame} de fama` : ''}`]); }
    else if (ex && ex.station) { const rs = RECIPES.filter(r => r.station === ex.station); rows.push(['🔨', 'Oficina', `${rs.length} receitas: ${rs.slice(0, 6).map(r => ITEMS[r.out].name).join(', ')}${rs.length > 6 ? '…' : ''}`]); }
    else if (ex && (ex.deco || ex.infra || ex.power)) { const d = ex.deco || {}; rows.push(['🏛️', 'Efeito', [d.power || ex.power ? `+${d.power || ex.power} de poder econômico na vila próxima` : '', d.happy || ex.happy ? `+${d.happy || ex.happy} de felicidade do reino/mês` : '', d.fame ? `+${d.fame} de fama` : ''].filter(Boolean).join(' · ') || BUILDINGS[k].desc]); }
    else if (STATIONS && Object.values(STATIONS).some(s => s.types.includes(k))) { const st = Object.keys(STATIONS).find(s => STATIONS[s].types.includes(k)); const rs = RECIPES.filter(r => r.station === st); rows.push(['🔨', 'Oficina', `${rs.length} receitas`]); }
    rows.unshift(['💎', 'Valor de mercado do custo', `${Math.round(val)} 🪙`]);
    return `<div class="sec">📊 O que rende</div><div class="ii-mini">${rows.map(([ic, l, v]) => `<div class="ii-row"><span>${ic}</span><span><b>${l}:</b> ${UI.esc(v)}</span></div>`).join('')}</div>`;
  },
  // ---------------------------------------------------------------- 6. conversa organizada
  talkExtras(p) {
    if (!p || p.kin === 'child' && p.age < 10) return '';
    const lv = typeof FRIEND_LV !== 'undefined' ? FRIEND_LV.slice().reverse() : [], next = lv.find(x => p.aff < x[0]);
    const cur = lv.filter(x => p.aff >= x[0]).pop();
    const pct = next ? U.clamp((p.aff - (cur ? cur[0] : -100)) / (next[0] - (cur ? cur[0] : -100)) * 100, 0, 100) : 100;
    const wants = [];
    if (p.known && p.known.fav && p.fav && ITEMS[p.fav]) wants.push(`🎁 adora ${ITEMS[p.fav].name}`);
    if (p.mourn > G.day) wants.push('🖤 está de luto: seja gentil');
    if (p.preg) wants.push('🤰 espera um bebê');
    if (p.debt) wants.push('🧾 está endividado');
    if (p.lent) wants.push(`💸 espera os ${p.lent} 🪙 que emprestou`);
    if (p.rival) wants.push(p.vendetta ? `🗡️ quer vingar ${p.vendetta}` : '⚔️ é seu rival');
    if (p.spouse === 'player' && (p.attn || 0) < G.day - 1) wants.push('💞 quer a sua atenção');
    if (p.hostage !== undefined) wants.push('🔒 é refém na sua corte');
    return `<div class="tk-x"><div class="tk-x-lv"><small>${cur ? (p.sex === 'f' ? cur[2] : cur[1]) : 'Estranho'}${next ? ` → <b>${p.sex === 'f' ? next[2] : next[1]}</b> (faltam ${Math.ceil(next[0] - p.aff)})` : ' · nível máximo'}</small><div class="tk-x-bar"><i style="width:${pct}%"></i></div>${next && next[3] ? `<small class="muted">Libera: ${next[3]}</small>` : ''}</div>
      ${wants.length ? `<div class="tk-x-w">${wants.map(w => `<span>${UI.esc(w)}</span>`).join('')}</div>` : ''}</div>`;
  },
  // ---------------------------------------------------------------- 8. chance na guerra
  warOdds(wc) {
    const mine = War.armyOf(wc.side, wc.own ? wc.cfg : null), foe = War.armyOf(wc.enemy);
    if (!wc.own) mine.cats += wc.cfg.cats;
    let pm = War.power(mine, wc.cfg.capangas ? War.heroPower() : 2), pf = War.power(foe);
    if (typeof Reign !== 'undefined' && G.civs[wc.side].ruler === 'player') { const A = Reign.R().army; pm *= 1 + A.training / 350 + (A.morale - 50) / 300 + Reign.generals().length * 0.04; }
    if (typeof Heroes !== 'undefined') { pm += Heroes.of(wc.side).slice(0, 2).length * 3; pf += Heroes.of(wc.enemy).slice(0, 2).length * 3; }
    if (War.weather) { const wx = War.weather(wc); pm *= wx.mine; pf *= wx.foe; }
    const walls = 1.5;
    const field = U.clamp(pm / (pm + pf), 0.03, 0.97), attack = U.clamp(pm / (pm + pf * walls), 0.03, 0.97), defend = U.clamp(pm * walls / (pm * walls + pf), 0.03, 0.97);
    const spy = typeof Reign !== 'undefined' && Reign.R().spies[wc.enemy];
    return { field, attack, defend, spy };
  },
  oddsCard(wc) {
    const o = this.warOdds(wc), pc = x => `<b class="${x >= 0.6 ? 'ok' : x < 0.4 ? 'bad' : ''}">${Math.round(x * 100)}%</b>`;
    const lines = wc.assault === 'defend' ? [`🏰 Defender as muralhas: ${pc(o.defend)}`, 'Vencer: o inimigo perde o exército e deixa ouro. Perder: o seu reino cai.']
      : wc.own ? [`⚔️ Campo aberto: ${pc(o.field)} — vencer tira soldados do inimigo, toma uma vila e força a paz; perder custa ouro e uma vila.`, `🏰 Assalto ao castelo: ${pc(o.attack)} — vencer dá o reino inteiro; perder custa 20% do tesouro.`]
        : [`⚔️ Chance: ${pc(o.field)} — vencer rende a recompensa e relação; perder, só um agradecimento.`];
    return `<div class="card war-odds"><div class="sec">🎯 Chance estimada de vitória <span>${o.spy ? '🗡️ com dados do seu espião' : 'estimativa (sem espião lá)'}</span></div>${lines.map(l => `<p>${l}</p>`).join('')}${typeof Clima !== 'undefined' && War.weather && (War.weather(wc).mine < 1 || War.weather(wc).foe < 1) ? `<p>${CLIMA[Clima.kind(War.weather(wc).mine < 1 ? wc.enemy : wc.side)].icon} ${CLIMA[Clima.kind(War.weather(wc).mine < 1 ? wc.enemy : wc.side)].name}: ${War.weather(wc).mine < 1 ? '<b class="bad">você ataca na lama</b>' : '<b class="ok">o inimigo ataca na lama</b>'} (−${Math.round((1 - Math.min(War.weather(wc).mine, War.weather(wc).foe)) * 100)}% de força para quem ataca).</p>` : ''}<small class="muted">Conta soldados, arqueiros, cavaleiros, catapultas, treino, moral, generais, heróis, muralhas e o tempo do mês. A sorte também luta.</small></div>`;
  },
  // ---------------------------------------------------------------- 7. camadas do mapa
  layers() { const L = G.settings.mapLayers = G.settings.mapLayers || { biz: true, fav: true, war: true, faith: false, fair: true, fief: true }; for (const k of ['bank', 'elec', 'crisis', 'barb']) if (L[k] === undefined) L[k] = true; return L; },
};

// ------------------------------------------------------------------ ganchos
{
  // 9. Portfólio → Gestão
  const nh0 = UI.navHtml.bind(UI);
  UI.navHtml = function (groups, cur, act, body) {
    if (act === 'knav' && !groups.some(g => g[0] === 'Gestão')) {
      const n = UIP.alerts().length, king = typeof Reign !== 'undefined' && Reign.isKing();
      const items = [['x:alerts', '🔔', 'Avisos', n, UIP.alerts().some(a => a.urg >= 3)], ...(typeof Board !== 'undefined' ? Board.navItems() : []), king ? ['x:finance', '💰', 'Finanças do reino'] : null, ['x:board', '📊', 'Negócios', Biz.list().length], ['x:society', '🤝', 'Sociedade'], ['x:merc', '⚔️', 'Mercenários', typeof Mercs !== 'undefined' ? Mercs.mine().length || '' : ''], ['x:games', '🏅', 'Jogos', typeof Games !== 'undefined' && Games.S().on ? '!' : ''], king ? ['x:reign', '👑', 'Reinado', Reign.R().dilemma ? '!' : ''] : null].filter(Boolean);
      groups = [groups[0], ['Gestão', items], ...groups.slice(1)];
    }
    return nh0(groups, cur, act, body);
  };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    if (nav === 'x:alerts') return UIP.alertsPage();
    if (nav === 'x:finance') return UIP.financePage();
    if (nav === 'x:board') return UI.pageHead('📊', 'Negócios', 'Seus empreendimentos, encomendas, guildas e mercados') + UIP.capture(() => UIP._raw.board(UI.sel.bbTab));
    if (nav === 'x:society') return UI.pageHead('🤝', 'Sociedade', 'Reputação, amigos, eventos, política e segredos') + UIP.capture(() => UIP._raw.society(UI.sel.socTab));
    if (nav === 'x:merc') return UI.pageHead('⚔️', 'Mercenários', 'Companhias livres para a guerra e para golpes') + Mercs.page();
    if (nav === 'x:games') return UI.pageHead('🏅', 'Jogos dos Sete Reinos', 'Justa, arco e flecha e duelos entre os reinos') + Games.page();
    if (nav === 'x:reign') return UI.pageHead('👑', `${Reign.titleName()} ${UI.esc(G.name)}`, 'Conselho, audiências, vassalos, espionagem, herdeiros, diplomacia, tesouro, exército e corte') + UIP.capture(() => UIP._raw.reign(UI.sel.rgTab));
    return kp0(nav);
  };
  // as janelas de Negócios, Sociedade e Reinado abrem como páginas do Portfólio
  UIP._raw = { board: UI.showBizBoard.bind(UI), society: Society.show.bind(Society), reign: Reign.show.bind(Reign) };
  UI.showBizBoard = function (tab) { UI.sel.bbTab = tab || UI.sel.bbTab; UI.sel.knav = 'x:board'; UI.showKingdom(); };
  Society.show = function (tab) { UI.sel.socTab = tab || UI.sel.socTab; UI.sel.knav = 'x:society'; UI.showKingdom(); };
  Reign.show = function (tab) { if (!Reign.isKing()) return UIP._raw.reign(tab); UI.sel.rgTab = tab || UI.sel.rgTab; UI.sel.knav = 'x:reign'; UI.showKingdom(); };
  // as páginas novas do Portfólio rolam (não são cortadas em quadros)
  const fr0 = UI.fitReino.bind(UI);
  UI.fitReino = function (nav, pkey) { if ((nav || this.sel.knav || '').startsWith('x:')) { const body = this.panel && this.panel.querySelector('.iconnav .snav-body'); if (body) body.classList.remove('kfit'); return; } return fr0(nav, pkey); };
  // 2. ficha do item no inventário e nas oficinas; o botão "Usar" sem uso some
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showInventory' && this.sel.inv && ITEMS[this.sel.inv]) body = body.replace('<button class="ldi-a ldi-trash"', `<button class="ldi-a ldi-info" data-act="iinfo" data-k="${this.sel.inv}" title="Ficha do item"><span class="ldi-ai">📖</span><span>Ficha</span></button><button class="ldi-a ldi-trash"`);
    if (fn === 'showWarCouncil' && G.warCall) { const i = body.indexOf('<div class="kgrid two">'); body = i >= 0 ? body.slice(0, i) + UIP.oddsCard(G.warCall) + body.slice(i) : body + UIP.oddsCard(G.warCall); }
    return op0(title, body, fn, args, sub);
  };
  // 4. oficinas: valor e lucro, e a ficha do produto
  const cd0 = UI.craftDetailHtml.bind(UI);
  UI.craftDetailHtml = function (r, so) {
    const h = cd0(r, so), it = ITEMS[r.out], cost = Order.costValue(r.cost), val = it.price * r.n, best = Math.max(...G.civs.map((c, ci) => Game.price(ci, r.out).sell)) * r.n;
    return h + `<div class="sec">💰 Vale a pena?</div><div class="ii-mini"><div class="ii-row"><span>📦</span><span><b>Você faz:</b> ${r.n} × ${it.name} (valor ${val} 🪙 · o melhor comprador paga ${best} 🪙)</span></div>
      <div class="ii-row"><span>🧺</span><span><b>Ingredientes:</b> ~${Math.round(cost)} 🪙 no mercado</span></div><div class="ii-row"><span>${val - cost >= 0 ? '📈' : '📉'}</span><span><b>${val - cost >= 0 ? 'Lucro' : 'Prejuízo'}:</b> ${Math.round(val - cost)} 🪙 por receita</span></div></div>
      <div class="act-row"><button data-act="iinfo" data-k="${r.out}">📖 Ficha de ${it.name}</button></div>`;
  };
  // a origem dos itens fica completa (natureza, monstros, criações, negócios, oficinas e lojas)
  UI.whereToGet = function (k) { if (k === 'fish') return 'pesca (vara de pesca na água)'; const s = UIP.sources(k); return s.length ? s.map(([, l, v]) => `${l.toLowerCase()}: ${v}`).join(' · ') : 'comércio e recompensas'; };
  // 5. construção: o que rende; o número do menu lateral mostra quantas dá para erguer agora
  const bd0 = UI.buildDetailHtml.bind(UI);
  UI.buildDetailHtml = function (k) { return bd0(k) + (BUILDINGS[k] ? UIP.buildYield(k) : ''); };
  // 6. conversa: barra de amizade, o que a pessoa quer e as etiquetas organizadas
  const tk0 = UI.showTalk.bind(UI);
  UI.showTalk = function (id, res) {
    const r = tk0(id, res), p = People.get(id), box = this.panel && this.panel.querySelector('.tk2-chips');
    if (p && box && !box.dataset.org) {
      box.dataset.org = '1';
      box.insertAdjacentHTML('beforebegin', UIP.talkExtras(p));
      const chips = [...box.children], keep = chips.filter(c => c.classList.contains('tag') || /Casa |Casad|Grávid|luto|Rival|Vingança|Favorito|Herói|Lenda|segredo/i.test(c.textContent)).slice(0, 6), rest = chips.filter(c => !keep.includes(c));
      if (rest.length > 2) { const d = document.createElement('details'); d.className = 'tk-more'; d.innerHTML = `<summary>Mais sobre ${UI.esc(p.name)} (${rest.length})</summary>`; const w = document.createElement('div'); w.className = 'tk2-chips'; for (const c of rest) w.appendChild(c); d.appendChild(w); box.after(d); }
    }
    return r;
  };
  // 7. mapa com camadas
  const rs0 = MapView.renderSide.bind(MapView);
  MapView.renderSide = function () {
    rs0(); if (!this.side) return;
    const L = UIP.layers(), names = { biz: '💼 Negócios', fav: '⭐ Favoritos', war: '⚔️ Guerras', faith: '⛪ Religiões', fair: '🎪 Feiras e leilões', fief: '🏰 Feudos', bank: '🏦 Bancos', elec: '🗳️ Eleições', crisis: '🚨 Crises', barb: '🏴 Bárbaros' };
    this.side.insertAdjacentHTML('afterbegin', `<div class="mv-sec mp-sec"><h4>🧭 Camadas</h4><div class="mv-layers">${Object.keys(names).map(k => `<button class="${L[k] ? 'on' : ''}" data-layer="${k}">${names[k]}</button>`).join('')}</div></div>`);
    if (!this.side.dataset.lay) { this.side.dataset.lay = '1'; this.side.addEventListener('click', e => { const b = e.target.closest('[data-layer]'); if (!b) return; e.stopPropagation(); const L2 = UIP.layers(); L2[b.dataset.layer] = !L2[b.dataset.layer]; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (er) { /* só nesta sessão */ } MapView.renderSide(); MapView.draw(); }, true); }
  };
  const md0 = MapView.draw.bind(MapView);
  MapView.draw = function () {
    const L = UIP.layers(), favs = typeof Favorites !== 'undefined' ? Favorites.list : null;
    if (favs && !L.fav) Favorites.list = () => [];
    try { md0(); } finally { if (favs) Favorites.list = favs; }
    if (!this.cv) return;
    const g = this.cv.getContext('2d'), dpr = window.devicePixelRatio || 1, z = this.z, X = tx => (tx - this.ox) * z, Y = ty => (ty - this.oy) * z;
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    const mark = (tx, ty, ic, label, size) => { if (typeof Fog !== 'undefined' && !Fog.seen(Math.floor(tx), Math.floor(ty))) return; /* o que fica na neblina não aparece */ const x = X(tx), y = Y(ty); if (x < -30 || y < -30 || x > this.cw + 30 || y > this.ch + 30) return; g.font = `${size || 14}px sans-serif`; g.fillText(ic, x, y); if (label && z >= 2) { g.font = '600 10px "Segoe UI", sans-serif'; g.lineWidth = 3; g.strokeStyle = 'rgba(14,10,6,0.85)'; g.strokeText(label, x, y + 13); g.fillStyle = '#ffe9a8'; g.fillText(label, x, y + 13); } };
    if (L.biz) for (const s of Biz.list()) mark(s.x + s.w / 2, s.y + s.h / 2, '💼', z >= 4 ? BUILDINGS[s.type].name : '', 12);
    World.capitals.forEach((cp, ci) => {
      if (!G.civs[ci]) return;
      if (L.war && Diplo.warsOf(ci).length) mark(cp.x + 4, cp.y - 4, '⚔️', '', 15);
      if (L.faith && typeof Religion !== 'undefined') { const r = RELIGIONS[Religion.of(ci)]; if (r) mark(cp.x - 4, cp.y - 4, r.icon, r.name, 14); }
      if (L.fair && typeof Commerce !== 'undefined') { if (Commerce.fair(ci)) mark(cp.x, cp.y + 5, '🎪', Commerce.fair(ci).name, 15); const a = Commerce.auction(ci); if (a) mark(cp.x + 5, cp.y + 4, '🔨', ITEMS[a.item].name, 13); }
    });
    if (L.bank) for (const s of World.structs) if (s && s.type === 'bank' && !s.removed) mark(s.x + 2.5, s.y + 2, '🏦', z >= 2.5 && typeof Bank !== 'undefined' ? Bank.name(s.owner) : '', 14);
    if (L.elec && typeof Society !== 'undefined') World.villages.forEach((v, vi) => { const E = (Society.S().elect || {})[vi]; if (!E || !v) return; if (E.tie) mark(v.x - 3, v.y - 3, '⚖️', 'empate: você decide', 16); else if (E.next - G.day <= 1 || E.me) mark(v.x - 3, v.y - 3, '🗳️', z >= 3 ? `eleição ${Calendar.short(E.next)}` : '', 13); });
    if (L.crisis && typeof Bank !== 'undefined') World.capitals.forEach((cp, ci) => { const c = G.civs[ci]; if (!c || !cp) return; if (c.anarchy) mark(cp.x, cp.y - 6, '💥', 'anarquia', 18); else if (Bank.K(ci).crisis) mark(cp.x, cp.y - 6, '🚨', `crise ${Bank.K(ci).crisis}/${BANK_CRISIS}`, 16); });
    if (L.barb && typeof Bank !== 'undefined') for (const c of Bank.B().camps) mark(c.x + 1.5, c.y + 1.5, '🏴', z >= 3 ? 'bárbaros' : '', 14);
    if (L.fief && typeof Reign !== 'undefined') for (const [vi, f] of Object.entries(Reign.R().fiefs)) { const v = World.villages[vi], p = G.people[f.pid]; if (v) mark(v.x + 2.5, v.y - 2.5, f.rebel ? '🏴' : '🏰', p ? `${['Barão', 'Conde', 'Marquês'][f.rank || 0]} ${p.name}` : '', 13); }
    g.restore();
  };
  // ações
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'iinfo') { UIP.showItem(d.k); return; }
    if (a === 'alGo') { const x = (UIP.lastAlerts || [])[+d.i]; if (x && x.go) x.go(); return; }
    if (a === 'alPage') { UIP.goPage(d.k, d.t); return; }
    return a0(a, d);
  };
  // o sino de avisos e o histórico do tesouro
  let bellT = 0;
  const u0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { u0(dt); bellT -= dt; if (bellT <= 0) { bellT = 1; UIP.bell(); } };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); if (typeof Reign !== 'undefined') { const R = Reign.R(); R.hist = R.hist || {}; for (const c of G.civs.filter(x => x.ruler === 'player')) { const H = R.hist[c.id] || (R.hist[c.id] = []); H.push(c.treasury); if (H.length > 12) H.shift(); } } };
}
