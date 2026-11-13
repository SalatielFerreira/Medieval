'use strict';
// Linhagens → Árvore da casa, redesenhada: uma árvore de verdade, com as gerações ligadas por ramos — os antepassados
// em cima, você e o seu cônjuge no tronco, os filhos e os netos nos galhos —, cartões que mostram idade, profissão,
// casamento e quem é o herdeiro (clique para conversar), e ao lado o quadro da Casa: brasão, gerações, quantos vivem,
// o herdeiro e as casas ligadas pelo casamento. Tudo cabe na janela (galhos cheios mostram "+N").
const Arvore = {
  esc(s) { return UI.esc(s); },
  heir() {
    // o herdeiro escolhido no Reinado; senão, o filho mais velho com 16 anos ou mais
    const R = typeof Reign !== 'undefined' ? Reign.R() : null, ch = R && R.heir !== null && R.heir !== undefined ? G.people[R.heir] : null;
    if (ch && ch.alive && ch.kin === 'child' && ch.age >= 16) return ch;
    return G.people.filter(p => p.alive && p.kin === 'child' && p.age >= 16).sort((a, b) => b.age - a.age)[0] || null;
  },
  face(q) { return q.alive === false ? '✝' : q.age < 4 ? '👶' : q.age < 14 ? '🧒' : q.age >= 60 ? (q.sex === 'f' ? '👵' : '👴') : q.sex === 'f' ? '👩' : '👨'; },
  card(q, o = {}) {
    const esc = this.esc.bind(this), click = typeof q.id === 'number' && q.alive !== false && q.id >= 0;
    const tags = [];
    if (o.heir) tags.push('<i class="av-t gold">👑 herdeiro</i>');
    if (q.prof && typeof PROFESSIONS !== 'undefined' && PROFESSIONS[q.prof]) tags.push(`<i class="av-t">${PROFESSIONS[q.prof].icon} ${esc(q.sex === 'f' ? PROFESSIONS[q.prof].f : PROFESSIONS[q.prof].name)}</i>`);
    if (q.spouse !== undefined && q.spouse !== null && q.spouse !== 'player' && q.alive !== false) tags.push('<i class="av-t">💍 casad' + (q.sex === 'f' ? 'a' : 'o') + '</i>');
    if (q.capanga) tags.push('<i class="av-t">⚔️ com você</i>');
    return `<${click ? 'button' : 'div'} class="av-card ${q.sex === 'f' ? 'f' : 'm'} ${o.cls || ''} ${q.alive === false ? 'dead' : ''}" ${click ? `data-act="tk" data-op="open" data-id="${q.id}" title="Conversar com ${esc(q.name)}"` : ''}>
      <span class="av-face">${this.face(q)}</span><span class="av-tx"><b>${esc(q.name)}</b><small>${esc(o.sub || (q.alive === false ? '✝' : `${q.age} anos`))}</small>${tags.length ? `<span class="av-tags">${tags.join('')}</span>` : ''}</span></${click ? 'button' : 'div'}>`;
  },
  more(n) { return n > 0 ? `<div class="av-more">+${n}</div>` : ''; },
  html(btns) {
    const esc = this.esc.bind(this), f = Families.ensurePlayer(), dyn = G.dynasty || [];
    const sp = G.family && G.family.spouse !== null ? People.get(G.family.spouse) : null;
    const kids = G.people.filter(k => (k.parents || []).includes('player') || k.kin === 'child').sort((a, b) => b.age - a.age);
    const kidIds = new Set(kids.map(k => k.id)), grand = G.people.filter(g => (g.parents || []).some(id => kidIds.has(id))).sort((a, b) => b.age - a.age);
    const heir = this.heir(), alive = 1 + (sp && sp.alive ? 1 : 0) + kids.filter(k => k.alive).length + grand.filter(g => g.alive).length;
    const anc = dyn.slice(-4), ancMore = dyn.length - anc.length;
    const tier = (lab, inner, cls) => `<div class="av-tier ${cls || ''}"><span class="av-lab">${lab}</span><div class="av-row">${inner}</div></div>`;
    const ancHtml = dyn.length ? this.more(ancMore) + anc.map((h, i) => this.card({ name: h.name, sex: h.sex, alive: false }, { sub: `${dyn.length - anc.length + i + 1}ª geração · viveu ${h.age} anos`, cls: 'anc' })).join('')
      : '<div class="av-empty">🌱 Você é a primeira geração da Casa: a árvore começa aqui.</div>';
    const me = { name: `${G.name} ${G.surname || ''}`.trim(), sex: P.sex, age: P.age };
    const trunk = this.card(me, { cls: 'hero', sub: `${P.age} anos · ${dyn.length + 1}ª geração` }) + `<span class="av-ring">${sp ? '💍' : '·'}</span>` + (sp ? this.card(sp, { cls: 'spouse', sub: `${sp.age} anos${sp.alive === false ? ' · ✝' : ''}` }) : '<div class="av-ghost">💍 sem cônjuge</div>');
    const K = 6, GR = 7;
    const kidsHtml = kids.length ? kids.slice(0, K).map(k => this.card(k, { heir: heir && heir.id === k.id, sub: `${k.age} anos${k.alive ? '' : ' · ✝'}` })).join('') + this.more(kids.length - K) : '<div class="av-ghost">👶 ainda sem filhos</div>';
    const grandHtml = grand.length ? grand.slice(0, GR).map(g => this.card(g, { sub: `${g.age} anos`, cls: 'small' })).join('') + this.more(grand.length - GR) : '';
    // casas ligadas pelo casamento (as dos cônjuges)
    const inlaws = [...new Set([sp, ...kids.map(k => k.spouse !== undefined && k.spouse !== null && k.spouse !== 'player' ? People.get(k.spouse) : null)].filter(Boolean).map(q => Families.of(q)).filter(x => x && !x.player))];
    const crest = `<span class="av-crest" style="--c:${f.color || PLAYER_COLOR}">${esc((G.surname || '?')[0])}</span>`;
    const side = `<div class="card av-side">${crest}<h3>Casa ${esc(G.surname || '')}</h3><small class="av-since">desde ${Calendar.short(f.since || 1)}</small>
        <div class="av-stats"><div><b>${dyn.length + 1}</b><small>gerações</small></div><div><b>${alive}</b><small>vivos</small></div><div><b>${kids.length}</b><small>filhos</small></div><div><b>${grand.length}</b><small>netos</small></div></div>
        <div class="av-heir"><span>👑</span><div><small>Herdeiro</small><b>${heir ? esc(People.full(heir)) : 'ninguém ainda'}</b><i>${heir ? `${heir.age} anos · assume quando você morrer` : 'um filho com 16 anos ou mais herda a casa'}</i></div></div>
        <div class="sec">💍 Casas ligadas pelo casamento</div><div class="av-houses">${inlaws.length ? inlaws.map(x => `<button class="ln-house" data-act="famview" data-f="${x.id}"><i style="background:${x.color}"></i>${esc(Families.name(x))}</button>`).join('') : '<small class="muted">Nenhuma ainda.</small>'}</div>
        ${btns ? `<div class="av-btns">${btns}</div>` : ''}</div>`;
    const tree = `<div class="card av-tree"><div class="sec">🌳 Árvore da Casa ${esc(G.surname || '')} <span>clique numa pessoa para conversar</span></div><div class="av-trunk">
        ${tier('Antepassados', ancHtml, 'anc')}${tier('Você', trunk, 'me')}${tier('Filhos', kidsHtml, 'kids')}${grand.length ? tier('Netos', grandHtml, 'grand') : ''}</div></div>`;
    return `<div class="av">${tree}${side}</div>`;
  },
};
{
  // a página Linhagens: a Árvore da casa nova (os Laços continuam iguais)
  Lines.html = function (h) {
    const t = document.createElement('template'); t.innerHTML = h;
    const pick = sel => { const e = t.content.querySelector(sel); return e ? e.outerHTML : ''; };
    const btns = t.content.querySelector('.lg-open');
    const list = [
      ['arvore', '🌳', 'Árvore da casa', Arvore.html(btns ? btns.innerHTML : '')],
      ['lacos', '🤝', 'Laços e relações', `<div class="ln2-two">${pick('.ln-ties')}${pick('.ln-map')}</div>`],
    ];
    return UI.pageHead('🌳', 'Linhagens', 'A sua dinastia e os laços entre as casas') + Services.subs('ln', list);
  };
}
{
  // no celular, a árvore não é dividida em páginas: ela inteira ocupa a tela (compacta)
  const fr0 = UI.fitReino.bind(UI);
  UI.fitReino = function (nav, ...a) {
    const n = nav || this.sel.knav, body = this.panel && this.panel.querySelector('.iconnav .snav-body');
    if (body) body.classList.remove('av-fit');
    if (document.body.classList.contains('small') && n === 'tree' && body && body.querySelector('.av')) { body.classList.add('av-fit'); return; }
    return fr0(nav, ...a);
  };
}
