'use strict';
// Diário do herói redesenhado: Conquistas, Notícias, Estatísticas, Ranking e Heróis em páginas que cabem na janela (o
// que não couber vira partes ◀ 1/2 ▶, com Services.subs/paginate). Os dados e as ações são os de antes.
const DY_TITLES = [[0, '🌱', 'Novato'], [10, '🗡️', 'Aventureiro'], [25, '🛡️', 'Veterano'], [45, '⚔️', 'Campeão'], [70, '👑', 'Lenda'], [95, '🌟', 'Imortal']];

const DiaryView = {
  esc(s) { return UI.esc(s); },
  bar(v, cls) { return `<i class="dv-bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></i>`; },
  // 🏆 conquistas
  ach() {
    const got = ACHIEVEMENTS.filter(a => G.ach[a.id]), pct = Math.round(got.length / ACHIEVEMENTS.length * 100), esc = this.esc.bind(this);
    const tit = DY_TITLES.filter(t => pct >= t[0]).pop(), nextT = DY_TITLES.find(t => t[0] > pct);
    const last = got.slice().sort((a, b) => G.ach[b.id] - G.ach[a.id]).slice(0, 4), next = ACHIEVEMENTS.filter(a => !G.ach[a.id]).slice(0, 4);
    const card = (a, on) => `<div class="dv-a ${on ? 'got' : ''}"><span class="dv-medal">${a.icon}</span><div><b>${esc(a.name)}</b><small>${on ? `✔ ${Calendar.short(G.ach[a.id])}` : esc(a.desc)}</small></div></div>`;
    const resumo = `<div class="dv-achtop"><div class="dv-ring" style="--p:${pct}"><div><b>${got.length}</b><small>de ${ACHIEVEMENTS.length}</small></div></div>
        <div class="dv-title"><small>O seu título</small><h3>${tit[1]} ${tit[2]}</h3><p>${pct}% das conquistas.${nextT ? ` Faltam ${Math.ceil(nextT[0] / 100 * ACHIEVEMENTS.length) - got.length} para ${nextT[1]} ${nextT[2]}.` : ' Não há título acima!'}</p>${this.bar(pct, 'gold')}
          <div class="dv-steps">${DY_TITLES.map(t => `<span class="${pct >= t[0] ? 'on' : ''}">${t[1]}<small>${t[2]}</small></span>`).join('')}</div></div></div>
      <div class="dv-two"><div class="card"><div class="sec">✨ Últimas conquistas</div>${last.map(a => card(a, true)).join('') || '<small class="muted">Nenhuma ainda: comece pelas da direita.</small>'}</div>
        <div class="card"><div class="sec">🎯 Para buscar agora</div>${next.map(a => card(a, false)).join('') || '<small class="muted">Você conquistou tudo!</small>'}</div></div>`;
    return Services.subs('dyach', [['resumo', '🏆', 'Resumo', resumo],
      ['got', '✅', `Conquistadas (${got.length})`, got.length ? `<div class="dv-agrid sv-pl">${got.slice().sort((a, b) => G.ach[b.id] - G.ach[a.id]).map(a => card(a, true)).join('')}</div>` : '<div class="sv-none">🏆<small>Nenhuma conquista ainda.</small></div>'],
      ['todo', '🔒', `A conquistar (${ACHIEVEMENTS.length - got.length})`, `<div class="dv-agrid sv-pl">${ACHIEVEMENTS.filter(a => !G.ach[a.id]).map(a => card(a, false)).join('')}</div>`]]);
  },
  // 📰 notícias
  news() {
    const cat = NEWS_CATS.some(c => c[0] === UI.sel.ncat) ? UI.sel.ncat : 'all', all = News.L(), list = cat === 'all' ? all : all.filter(n => n.cat === cat), esc = this.esc.bind(this);
    const icon = c => (NEWS_CATS.find(x => x[0] === c) || NEWS_CATS[0])[1];
    const talk = id => id !== null && id !== undefined && G.people[id] && G.people[id].alive ? ` data-act="tk" data-op="open" data-id="${id}"` : '';
    const recent = all.filter(n => G.day - n.day <= 1), top = (recent.length ? recent : all).slice().sort((a, b) => b.w - a.w || b.day - a.day)[0];
    const item = n => { const m = n.text.match(/^(\S+)\s+(.*)$/s), lead = m && !/[A-Za-zÀ-ú0-9]/.test(m[1]) ? m : null; return `<div class="nw-item ${talk(n.pid) ? 'link' : ''}" data-cat="${n.cat}"${talk(n.pid)}><span class="nw-ic">${lead ? lead[1] : icon(n.cat)}</span><span>${esc(lead ? lead[2] : n.text)}</span><em>${Calendar.short(n.day)}</em></div>`; };
    const fam = News.famous().slice(0, 5);
    const counts = NEWS_CATS.filter(c => c[0] !== 'all').map(([k, ic, lab]) => `<button class="dv-nc" data-act="ncat" data-k="${k}"><span>${ic}</span><b>${all.filter(x => x.cat === k).length}</b><small>${lab}</small></button>`).join('');
    const manchetes = `${top ? `<div class="dv-head nw-top"${talk(top.pid)}><span class="dv-kick">📯 ${top.day === G.day ? 'Manchete do mês' : 'Última manchete'} · ${Calendar.short(top.day)}</span><b>${esc(top.text)}</b></div>` : ''}
      <div class="dv-ncs">${counts}</div>
      <div class="dv-two"><div class="card"><div class="sec">⭐ Gente em destaque</div>${fam.map((p, i) => `<div class="rk-row"${talk(p.id)}><span class="rk-m">${['🥇', '🥈', '🥉'][i] || '⭐'}</span><span class="rk-n"><b>${esc(People.full(p))}</b><small>${esc(People.title(p))} · ${esc(People.homeName(p))}</small></span><span class="rk-v">⭐ ${p.fame}</span></div>`).join('') || '<small class="muted">Ninguém se destacou ainda.</small>'}</div>
        <div class="card"><div class="sec">🕰️ As mais recentes</div><div class="dv-recent">${all.slice(0, 6).map(item).join('') || '<small class="muted">Nada ainda.</small>'}</div></div></div>`;
    const todas = `<div class="tabs nw-cats">${NEWS_CATS.map(([k, ic, lab]) => { const n = k === 'all' ? all.length : all.filter(x => x.cat === k).length; return `<button class="nw-cat ${k === cat ? 'on' : ''}" data-act="ncat" data-k="${k}">${ic} ${lab} <small>${n}</small></button>`; }).join('')}</div>
      ${list.length ? `<div class="card dv-feed"><div class="nw-list sv-pl">${list.slice(0, 120).map(item).join('')}</div></div>` : '<div class="sv-none">📰<small>Nada por aqui ainda.</small></div>'}`;
    return Services.subs('dynews', [['manchetes', '📯', 'Manchetes', manchetes], ['todas', '📰', `Todas as notícias (${all.length})`, todas]]);
  },
  // 📊 estatísticas
  stats() {
    const st = G.stats || {}, kills = Object.keys(st).filter(k => k.startsWith('kill_')).reduce((a, k) => a + st[k], 0);
    const W = [['🪓', 'árvores cortadas', st.trees, 30], ['⛏️', 'rochas quebradas', st.ores, 220], ['🌿', 'plantas colhidas', st.plants, 110], ['🎣', 'peixes pescados', st.fish, 200], ['🌱', 'sementes plantadas', st.planted, 95], ['🌾', 'alimentos colhidos', st.harvested, 45], ['🔨', 'itens criados', st.crafted, 25], ['🏗️', 'construções', st.built, 15]];
    const C = [['⚔️', 'abatidos', kills, 0], ['🗡️', 'bandidos derrotados', st.kill_bandit, 350], ['☠️', 'governadores derrotados', st.bosses, 280], ['🏕️', 'acampamentos destruídos', st.camps, 20], ['🛡️', 'golpes bloqueados', st.blocks, 210], ['🏆', 'batalhas vencidas', st.battlesWon, 45], ['🐫', 'caravanas salvas', st.caravansSaved, 120], ['🏴', 'caravanas saqueadas', st.caravansRobbed, 0]];
    const V = [['💰', 'baús abertos', st.chests, 45], ['🍺', 'bebidas tomadas', st.drinks, 35], ['🍻', 'lucro da taverna', st.tavernGold, 40], ['💍', 'casamentos', st.marriages, 330], ['👶', 'filhos', st.children, 300], ['🌟', 'nível', P.level, 50], ['📅', 'meses vividos', G.day, 260], ['🪙', 'ouro agora', P.gold, 45]];
    const tile = ([ic, l, v, hue]) => `<div class="dy-st dv-st" style="--hue:${hue}"><span class="dy-ic">${ic}</span><b>${(v || 0).toLocaleString('pt-BR')}</b><small>${l}</small></div>`;
    const grid = L => `<div class="dv-sgrid">${L.map(tile).join('')}</div>`;
    const best = W.concat(C, V.slice(0, 5)).filter(x => x[2] > 0).sort((a, b) => b[2] - a[2]).slice(0, 5), mx = Math.max(1, ...best.map(x => x[2]));
    const xpPct = typeof Game.xpNeed === 'function' ? Math.round((P.xp || 0) / Math.max(1, Game.xpNeed()) * 100) : 0;
    const resumo = `<div class="dv-hero"><div class="dv-lv"><small>nível</small><b>${P.level}</b>${this.bar(xpPct, 'gold')}</div>
        <div class="dv-facts"><div><span>📅</span><b>${G.day}</b><small>${G.day === 1 ? 'mês vivido' : 'meses vividos'}</small></div><div><span>🪙</span><b>${P.gold.toLocaleString('pt-BR')}</b><small>ouro</small></div><div><span>🏆</span><b>${Object.keys(G.ach || {}).length}</b><small>conquistas</small></div><div><span>⚔️</span><b>${kills}</b><small>abatidos</small></div><div><span>🌟</span><b>${G.fame || 0}</b><small>fama</small></div></div></div>
      <div class="card dv-best"><div class="sec">🏅 Os seus maiores feitos</div>${best.map(([ic, l, v]) => `<div class="dv-br"><span>${ic}</span><b>${v.toLocaleString('pt-BR')}</b><small>${l}</small>${this.bar(v / mx * 100)}</div>`).join('') || '<small class="muted">Nada ainda: corte árvores, pesque, lute, construa!</small>'}</div>`;
    return Services.subs('dystats', [['resumo', '🌟', 'Resumo', resumo], ['trab', '⚒️', 'Trabalho', grid(W)], ['comb', '⚔️', 'Combate', grid(C)], ['vida', '🍻', 'Vida', grid(V)]]);
  },
  // 🏅 ranking
  rank() {
    const rows = Ranking.rows(), you = Ranking.hero(), esc = this.esc.bind(this), medal = ['🥇', '🥈', '🥉'], n = rows.length;
    const mine = [['💰', 'Ouro', you.wealth.toLocaleString('pt-BR'), 'wealth'], ['🌟', 'Prestígio', you.popularity, 'popularity'], ['⚔️', 'Inimigos derrotados', you.kills, 'kills'], ['👶', 'Filhos', you.children, 'children'], ['💪', 'Força', you.str, 'str'], ['🧠', 'Inteligência', you.int, 'int'], ['⭐', 'Nível', you.level, 'level']];
    const voce = `<div class="dv-me">${mine.map(([ic, l, v, k]) => { const pos = Ranking.place(rows, k), pct = Math.round((1 - (pos - 1) / Math.max(1, n - 1)) * 100);
        return `<div class="dv-mr"><span class="dv-mi">${ic}</span><div><b>${l}</b><small>${v}</small></div><em class="${pos <= 3 ? 'top' : ''}">${pos <= 3 ? medal[pos - 1] : ''} ${pos}º <small>de ${n}</small></em>${this.bar(pct, pos <= 10 ? 'gold' : '')}<small class="dv-pct">melhor que ${Math.max(0, pct)}% do mundo</small></div>`; }).join('')}</div>`;
    const cards = Ranking.CATS.map(([key, ic, title, fmt]) => { const top = Ranking.top(rows, key), pos = key === 'friend' ? 0 : Ranking.place(rows, key);
      return `<div class="card rk-card"><div class="sec">${ic} ${title}${pos ? ` <span>você: ${pos}º</span>` : ''}</div>${top.map((r, i) => `<div class="rk-row ${r.you ? 'you' : ''}" ${r.p ? `data-act="tk" data-op="open" data-id="${r.p.id}"` : ''}><span class="rk-m">${medal[i]}</span>
        <span class="rk-n"><b>${esc(r.name)}</b><small>${esc(r.sub)}${r.p && r.p.civ >= 0 && CIV_DEFS[r.p.civ] ? ' · ' + CIV_DEFS[r.p.civ].short : ''}</small></span><span class="rk-v">${fmt(r[key])}</span></div>`).join('') || '<p class="muted">Ninguém ainda.</p>'}</div>`; }).join('');
    return Services.subs('dyrank', [['voce', '👤', 'Você no mundo', voce], ['rankings', '🏆', 'Os melhores do mundo', `<div class="rk-grid dv-rk sv-pl">${cards}</div>`]]);
  },
  // ⚔️ heróis
  heroes() {
    Heroes.ensure();
    const esc = this.esc.bind(this), all = Heroes.all(), max = Math.max(150, ...all.map(q => q.hero.fame));
    const civN = ci => ci >= 0 && CIV_DEFS[ci] ? CIV_DEFS[ci].short : '';
    const row = (p, i) => { const h = p.hero; return `<div class="dv-hr" data-act="tk" data-op="open" data-id="${p.id}"><em>${i + 1}</em>${p.civ >= 0 && CIV_DEFS[p.civ] ? Heraldry.armsSvg(p.civ, 16) : ''}<span><b>${esc(p.name)} <i>${esc(h.epi)}</i></b><small>${civN(p.civ)} · ${h.wins} vitórias · ${h.kills} derrubados</small></span>${this.bar(h.fame / max * 100, 'gold')}<b class="dv-fame">${h.fame}</b></div>`; };
    const pod = [1, 0, 2].map(i => all[i]).map((p, k) => p ? `<div class="dv-pod p${[2, 1, 3][k]}" data-act="tk" data-op="open" data-id="${p.id}"><span>${['🥈', '🥇', '🥉'][k]}</span>${p.civ >= 0 && CIV_DEFS[p.civ] ? Heraldry.armsSvg(p.civ, [26, 34, 24][k]) : ''}<b>${esc(p.name)}</b><i>${esc(p.hero.epi)}</i><em>${p.hero.fame} de fama</em><u></u></div>` : '<span></span>').join('');
    const famosos = `<div class="dv-two wide"><div class="card dv-podc"><div class="sec">🏆 Os mais famosos dos sete reinos</div><div class="dv-pods">${pod}</div>
        <div class="dv-you"><span>🌟</span><div><b>A sua fama: ${G.fame || 0}</b><small>Vencer batalhas e derrubar heróis inimigos aumenta a sua fama. Os heróis do seu reino lutam ao seu lado.</small></div></div></div>
      <div class="card"><div class="sec">📜 Top 10</div>${all.slice(0, 10).map(row).join('') || '<small class="muted">Nenhum herói.</small>'}</div></div>`;
    const reinos = `<div class="dv-civs sv-pl">${G.civs.filter(c => CIV_DEFS[c.id]).map(c => { const L = Heroes.of(c.id), war = Diplo.warsOf(c.id).length;
      return `<div class="dv-civ" style="--c:${Game.civColor(c.id)}"><div class="dv-ch">${Heraldry.armsSvg(c.id, 24)}<b>${esc(CIV_DEFS[c.id].short)}</b><small>${war ? '⚔️ em guerra' : '🕊️ em paz'}</small></div>
        ${L.map(p => `<div class="dv-hc" data-act="tk" data-op="open" data-id="${p.id}"><span>${p.hero.fame >= 150 ? '👑' : p.hero.fame >= 80 ? '🥇' : '🏅'}</span><div><b>${esc(p.name)} <i>${esc(p.hero.epi)}</i></b>${this.bar(p.hero.fame / max * 100, 'gold')}<small>${p.hero.deeds[0] ? esc(p.hero.deeds[0].t.length > 60 ? p.hero.deeds[0].t.slice(0, 59) + '…' : p.hero.deeds[0].t) : `${p.age} anos`}</small></div><em>${p.hero.fame}</em></div>`).join('') || '<small class="muted">Nenhum herói.</small>'}</div>`; }).join('')}</div>`;
    const F = Heroes.fallen();
    const lendas = F.length ? `<div class="dv-fallen sv-pl">${F.map(f => `<div class="dv-f"><span>✝</span><div><b>${esc(f.name)} <i>${esc(f.epi)}</i></b><small>${esc(Heroes.civName(f.civ))} · caiu ${esc(f.cause)}${f.by ? ' diante de ' + esc(f.by) : ''} · ${Calendar.short(f.day)} · ${f.wins} vitórias</small></div><em>${f.fame}<small>fama</small></em></div>`).join('')}</div>` : '<div class="sv-none">⚰️<small>Nenhum herói caiu ainda.</small></div>';
    return Services.subs('dyher', [['famosos', '🏆', 'Os mais famosos', famosos], ['reinos', '🏰', 'Por reino', reinos], ['lendas', '⚰️', `Lendas caídas${F.length ? ` (${F.length})` : ''}`, lendas]]);
  },
};

{
  const HEADS = { ach: ['🏆', 'Conquistas', () => `${Object.keys(G.ach || {}).length} de ${ACHIEVEMENTS.length} desbloqueadas`], news: ['📰', 'O Pregoeiro', () => `${News.L().length} notícias · a gente, os negócios, as famílias, as vilas e os reinos`],
    stats: ['📊', 'Estatísticas', () => 'Tudo o que você já fez nesta vida'], rank: ['🏅', 'Ranking do mundo', () => `${Ranking.rows().length - 1} pessoas vivas · clique numa pessoa para conversar`], heroes: ['⚔️', 'Heróis dos reinos', () => `${Heroes.all().length} heróis vivos · clique num herói para conversar`] };
  // escolher um assunto das notícias abre a lista de todas
  const ac0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'ncat') (this.sel.svSub || (this.sel.svSub = {})).dynews = 'todas'; return ac0(a, d); };
  const sd0 = UI.showDiaryM.bind(UI);
  UI.showDiaryM = function (...a) {
    const op = this.open; let got = null;
    this.open = (...x) => { got = x; };
    try { sd0(...a); } finally { this.open = op; }
    if (!got) return;
    const tab = ['ach', 'news', 'stats', 'rank', 'heroes'].includes(this.sel.dtab) ? this.sel.dtab : 'ach', H = HEADS[tab];
    const t = document.createElement('template'); t.innerHTML = got[1];
    const body = t.content.querySelector('.snav-body');
    if (body) body.innerHTML = `<div class="kpg">${this.pageHead(H[0], H[1], H[2]())}${DiaryView[tab]()}</div>`;
    const r = this.open(got[0], t.innerHTML, got[2], got[3], got[4]);
    this.fitReino('d:' + tab, 'diary/' + tab);
    try { Services.paginate(); } catch (e) { console.error(e); }
    return r;
  };
}
