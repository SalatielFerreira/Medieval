'use strict';
// Serviços (Portfólio): as páginas de Fora da lei e de Mercenários redesenhadas (os botões e as ações são os mesmos).
//  🗡️ Fora da lei: a faixa com os caminhos da vida de fora da lei (ou o painel do seu bando), o cartaz de PROCURADO com
//     o perdão de cada reino, os bandos da região (os acampamentos perto de você, com os membros de verdade de cada um)
//     e, para o chefe, os golpes: caravanas e vilas em cartões.
//  ⚔️ Mercenários: o resumo do que você tem contratado, cada companhia como um estandarte (emblema, lema, capitão,
//     barras de força e lealdade, faixa da situação) e as notícias numa linha do tempo.
const MERC_COLORS = { lobo: '#6a7480', lancas: '#3a3a4a', corvos: '#4a3a5a', leao: '#b8862a', pantano: '#4a6a3a', errantes: '#7a3a2a' };

const Services = {
  esc(s) { return UI.esc(s); },
  bar(v, max, cls) { return `<i class="sv-bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></i></i>`; },
  // o cartaz de procurado
  poster() {
    const W = OutLaw.wanted(), tb = OutLaw.totalBounty();
    if (!W.length) return `<div class="sv-poster calm"><div class="sv-ph">Ninguém procura você</div><div class="sv-pface">🕊️</div><small>O seu nome está limpo em todos os reinos. Um crime e a cabeça vai a prêmio.</small></div>`;
    return `<div class="sv-poster"><div class="sv-ph">PROCURADO</div><div class="sv-pname">${this.esc(G.name)}</div><div class="sv-preward">${tb.toLocaleString('pt-BR')} 🪙</div><small>pela sua cabeça${tb > 300 ? ' · caçadores de recompensa estão atrás de você' : ''}</small>
      <div class="sv-plist">${W.map(x => `<div class="sv-prow"><span>${Heraldry.armsSvg(x.ci, 18)}</span><span><b>${CIV_DEFS[x.ci].short} · ${x.w.bounty} 🪙</b><small>${this.esc(x.w.crimes.join(', '))}${x.w.resist ? ' · os guardas atacam' : ''}</small></span>
        <button data-act="ol" data-op="pardon" data-c="${x.ci}" ${P.gold >= OutLaw.pardonCost(x.ci) ? '' : 'disabled'}>📜 Perdão — ${OutLaw.pardonCost(x.ci)} 🪙</button></div>`).join('')}</div></div>`;
  },
  // os acampamentos perto de você e quem está em cada bando
  bands() {
    const px = P.x / TILE, py = P.y / TILE;
    const camps = World.camps.map((c, i) => ({ c, i, d: U.dist(px, py, c.x + 1.5, c.y + 1.5) })).filter(x => !x.c.cleared).sort((a, b) => a.d - b.d).slice(0, 4);
    if (!camps.length) return '<div class="sv-none">⛺<small>Nenhum acampamento de bandidos de pé por perto.</small></div>';
    return camps.map(({ c, i, d }) => {
      const mem = typeof Bands !== 'undefined' ? Bands.members('camp' + i) : [], fam = mem.length ? mem[0].surname : null;
      const angry = typeof Bands !== 'undefined' && Bands.angry(c), hide = G.outlaw && c.hideout;
      const st = hide ? ['⛺', 'o seu esconderijo', 'mine'] : angry ? ['😠', 'bravos com você', 'bad'] : ['🤫', 'na deles: só atacam se atacados', ''];
      return `<div class="sv-camp ${st[2]}"><div class="sv-ch"><b>⛺ ${fam ? `Bando dos ${this.esc(fam)}` : 'Acampamento de bandidos'}</b><small>${Math.round(d)} passos · ${c.left || 0} na guarda</small></div>
        <div class="sv-cst">${st[0]} ${st[1]}</div>
        <div class="sv-mem">${mem.length ? mem.slice(0, 5).map(p => `<span title="${this.esc((TRAITS[p.trait] || {}).name || '')}">${p.sex === 'f' ? '👩' : '🧔'} ${this.esc(p.name)} <small>${p.age} anos${p.bandFrom !== undefined && World.villages[p.bandFrom] ? ` · era de ${this.esc(World.villages[p.bandFrom].name)}` : ''}</small></span>`).join('') : '<small class="muted">Ninguém sabe quem são: chegue perto para ver.</small>'}</div></div>`;
    }).join('');
  },
  outlaw() {
    const O = OutLaw.O(), esc = this.esc.bind(this);
    if (!O) {
      const e = OutLaw.canStart();
      const ways = [['⛺', 'Esconderijo', 'Um acampamento vira a sua casa: descanse lá e os bandidos param de atacar você.'], ['🐫', 'Caravanas', 'Assalte as caravanas que passam pelas estradas.'],
        ['🔥', 'Saques e proteção', 'Saqueie vilas ou cobre delas para não saquear.'], ['🎯', 'Cabeça a prêmio', 'Cada golpe sobe a recompensa: guardas e caçadores vêm atrás.']];
      return `<div class="sv-hero ol"><div class="sv-hic">🏴</div><div class="sv-htx"><small>A vida de fora da lei</small><h3>Chefe de bandidos</h3><p>Um bando, um esconderijo e a estrada inteira para assaltar — com a cabeça a prêmio em todos os reinos.</p>
          <div class="sv-go"><button class="danger" data-act="ol" data-op="start" ${e ? 'disabled' : ''}>🗡️ Assumir o bando${OutLaw.totalBounty() < 150 ? ' (300 🪙)' : ''}</button>${e ? `<small>${esc(e)}</small>` : ''}</div></div>
          <div class="sv-ways">${ways.map(w => `<div><span>${w[0]}</span><b>${w[1]}</b><small>${w[2]}</small></div>`).join('')}</div></div>
        <div class="sv-cols"><div class="card sv-bandsc"><div class="sec">⛺ Bandos da região <span>gente de verdade</span></div>${this.bands()}</div>${this.poster()}</div>`;
    }
    const cars = OutLaw.caravans().slice(0, 6), vils = OutLaw.near(60).slice(0, 8);
    const stat = (ic, v, l) => `<div class="sv-stat"><span>${ic}</span><b>${v}</b><small>${l}</small></div>`;
    return `<div class="sv-hero ol me"><div class="sv-hic">🏴</div><div class="sv-htx"><small>Fora da lei</small><h3>O bando de ${esc(G.name)}</h3>
          <div class="sv-stats">${stat('👥', O.band, 'no esconderijo')}${stat('🗡️', Game.allies().length, 'capangas')}${stat('💀', O.fame, 'fama de fora da lei')}${stat('💰', O.loot.toLocaleString('pt-BR'), 'saque total 🪙')}${stat('⚔️', Math.round(OutLaw.power()), 'força do bando')}</div>
          <div class="sv-go"><button data-act="ol" data-op="man">➕ Homem no esconderijo — 30 🪙</button><button data-act="ol" data-op="cap">🗡️ Bandido para seguir você — 60 🪙</button><button data-act="ol" data-op="home">⛺ Ir ao esconderijo</button></div></div></div>
      <div class="sv-cols three">
        <div class="card"><div class="sec">🐫 Caravanas nas estradas <span>${cars.length}</span></div>${cars.length ? `<div class="sv-cars">${cars.map(c => `<button class="sv-car" data-act="ol" data-op="car" data-i="${c.id}"><span>${Heraldry.armsSvg(c.from, 16)}</span><b>${CIV_DEFS[c.from].short} → ${CIV_DEFS[c.to].short}</b><em>🗡️ Assaltar</em></button>`).join('')}</div>` : '<div class="sv-none">🐫<small>Nenhuma caravana na estrada agora.</small></div>'}</div>
        <div class="card"><div class="sec">🏘️ Vilas perto do esconderijo <span>${O.protect.length} pagam proteção</span></div>${vils.length ? vils.map(x => `<div class="sv-vil ${O.protect.includes(x.i) ? 'paid' : ''}"><span>🏘️</span><span><b>${esc(x.v.name)}</b><small>${x.v.free ? 'vila livre' : CIV_DEFS[x.v.civ].short} · ${Math.round(U.dist(x.v.x, x.v.y, O.hx, O.hy))} passos${O.protect.includes(x.i) ? ' · 💰 paga proteção' : ''}</small></span>
          <span class="sv-va"><button class="danger" data-act="ol" data-op="raid" data-v="${x.i}">🔥 Saquear</button>${O.protect.includes(x.i) ? '' : `<button data-act="ol" data-op="protect" data-v="${x.i}">💰 Proteção</button>`}</span></div>`).join('') : '<div class="sv-none">🏘️<small>Nenhuma vila por perto.</small></div>'}</div>
        ${this.poster()}</div>
      <div class="card sv-bandsc"><div class="sec">⛺ Bandos da região</div><div class="sv-campgrid">${this.bands()}</div></div>
      <div class="sv-quit"><button data-act="ol" data-op="quit">🏳️ Largar a vida de fora da lei</button></div>`;
  },
  mercs() {
    const M = Mercs.M(), esc = this.esc.bind(this), mine = Mercs.mine();
    const men = mine.reduce((a, d) => a + Mercs.co(d.id).size, 0), fee = mine.reduce((a, d) => a + Mercs.fee(d.id), 0);
    const maxPow = Math.max(...MERC_CO.map(d => Mercs.power(d.id)), 1);
    const cards = MERC_CO.map(d => {
      const c = M.co[d.id], L = Mercs.leader(d.id), my = c.emp === 'player', free = c.emp === null, col = MERC_COLORS[d.id] || '#5a4a3a';
      const rib = my ? ['⚔️ Luta por você', 'mine'] : free ? ['Livre para contratar', 'free'] : [`Serve a ${esc(Mercs.empName(c.emp))}`, 'taken'];
      return `<div class="sv-co ${rib[1]}" style="--c:${col}"><div class="sv-flag"><span>${d.icon}</span></div><div class="sv-rib">${rib[0]}</div>
        <b class="sv-cn">${esc(d.name)}</b><i class="sv-motto">"${esc(d.motto)}"</i><small class="sv-cap">${L.sex === 'f' ? 'Capitã' : 'Capitão'} <b>${esc(L.name)}</b></small>
        <div class="sv-cs"><span>👥 Homens <b>${c.size}</b></span><span>⭐ Qualidade <b>${Math.round(d.q * 100)}%</b></span>
          <span>⚔️ Força ${this.bar(Mercs.power(d.id), maxPow, 'pow')}<b>${Mercs.power(d.id)}</b></span><span>🤝 Lealdade ${this.bar(c.loyal, 100, c.loyal < 40 ? 'low' : 'loy')}<b class="${c.loyal < 40 ? 'bad' : ''}">${Math.round(c.loyal)}</b></span></div>
        ${c.unpaid ? `<div class="sv-warn">⚠️ ${c.unpaid} ${c.unpaid === 1 ? 'mês' : 'meses'} sem soldo: com 2, trocam de lado</div>` : ''}
        <div class="sv-fee">🪙 <b>${Mercs.fee(d.id)}</b> por mês</div>
        <div class="sv-ca">${my ? `<button data-act="mercOut" data-k="${d.id}">Dispensar</button><button data-act="tk" data-op="open" data-id="${L.id}">💬 ${L.sex === 'f' ? 'A capitã' : 'O capitão'}</button>` : free ? `<button class="primary" data-act="mercHire" data-k="${d.id}" ${P.gold >= Mercs.fee(d.id) ? '' : 'disabled'}>Contratar — ${Mercs.fee(d.id)} 🪙</button>` : '<small class="muted">Contratada por outro senhor</small>'}</div></div>`;
    }).join('');
    const rules = [['⚔️', 'Nas guerras', 'somam ao seu exército'], ['👑', 'Num golpe', 'seguram a guarda real na porta do trono'], ['🪙', 'O soldo', 'sai do seu bolso (ou do tesouro do seu reino)'], ['⚠️', '2 meses sem pagar', 'trocam de lado ou viram saqueadores']];
    return `<div class="sv-hero mc"><div class="sv-hic">⚔️</div><div class="sv-htx"><small>Companhias livres</small><h3>Mercenários</h3><p>Lutam por quem paga — e só enquanto pagam.</p>
          <div class="sv-stats">${[['🏳️', mine.length, mine.length === 1 ? 'companhia sua' : 'companhias suas'], ['👥', men, 'homens'], ['🪙', fee, 'soldo por mês']].map(([i, v, l]) => `<div class="sv-stat"><span>${i}</span><b>${v}</b><small>${l}</small></div>`).join('')}</div></div>
        <div class="sv-ways">${rules.map(w => `<div><span>${w[0]}</span><b>${w[1]}</b><small>${w[2]}</small></div>`).join('')}</div></div>
      <div class="sv-cogrid">${cards}</div>
      ${M.log.length ? `<div class="card sv-news"><div class="sec">📒 Notícias das companhias</div><div class="sv-tl">${M.log.slice(0, 8).map(l => `<div><em>${Calendar.short(l.day)}</em><span>${esc(l.t)}</span></div>`).join('')}</div></div>` : ''}`;
  },
};

OutLaw.page = function () { return Services.outlaw(); };
Mercs.page = function () { return Services.mercs(); };
