'use strict';
// Árvore da dinastia: as gerações da sua casa, de cima para baixo. Em cada geração, o herói (ou heroína) da vez com o
// cônjuge, e embaixo os filhos — o herdeiro que continuou a história desce para a geração seguinte; os outros filhos
// aparecem com os netos. Abre pelo livro da crônica (uma página com o resumo e o botão da árvore) e pelo Portfólio.
// Os filhos nascidos daqui em diante já ficam marcados com a geração; nos jogos antigos a geração é deduzida.

const Lineage = {
  L() { const u = G.urban || (G.urban = {}); return u.lineage || (u.lineage = { spouse: {} }); },
  // as pessoas que viraram heróis (cada uma é a geração seguinte da anterior)
  heroPeople() { return G.people.filter(p => p.becamePlayer).sort((a, b) => a.id - b.id); },
  gens() { return (G.dynasty || []).length + 1; },
  // de que geração de herói esta pessoa é filha
  genOf(p, hp) {
    if (p.heroGen !== undefined) return p.heroGen;
    const k = hp.indexOf(p); if (k >= 0) return k;                                // o herói da geração k+1 é filho da geração k
    if (p.parents[1] !== null && p.parents[1] !== undefined) { const j = hp.findIndex(h => h.parents[1] === p.parents[1]); if (j >= 0) return j; }
    const sp = this.spouseOf(this.gens() - 1, hp); if (sp !== null && p.parents[1] === sp) return this.gens() - 1;
    return hp.filter(h => h.id < p.id).length;                                      // pela ordem de nascimento
  },
  spouseOf(g, hp) {
    const L = this.L();
    if (g === this.gens() - 1 && G.family && G.family.spouse !== null) return G.family.spouse;
    if (L.spouse[g] !== undefined && L.spouse[g] !== null) return L.spouse[g];
    const next = hp[g]; return next && next.parents[1] !== undefined ? next.parents[1] : null;
  },
  // a árvore: [{ g, hero, spouse, kids: [{ p, heir, grand: [] }] }]
  tree() {
    const hp = this.heroPeople(), n = this.gens(), dyn = G.dynasty || [], out = [];
    const kidsAll = G.people.filter(p => p.parents && p.parents[0] === 'player');
    for (let g = 0; g < n; g++) {
      const now = g === n - 1, d = now ? { name: G.name, sex: P.sex, age: P.age, kingdoms: G.civs.filter(c => c.ruler === 'player').map(c => CIV_DEFS[c.id].short) } : dyn[g];
      const sid = this.spouseOf(g, hp), spouse = sid !== null && sid !== undefined ? G.people[sid] : null;
      const kids = kidsAll.filter(p => this.genOf(p, hp) === g).sort((a, b) => a.id - b.id).map(p => ({ p, heir: hp[g] === p, grand: p.becamePlayer ? [] : G.people.filter(q => q.parents && q.parents.includes(p.id)) }));
      out.push({ g, now, hero: d || { name: '?', sex: 'm', age: 0 }, spouse, kids });
    }
    return out;
  },
  // ---------------------------------------------------------------- desenho
  where(p) {
    if (p.home && p.home.type === 'castle' && G.civs[p.home.civ] && G.civs[p.home.civ].ruler !== 'player') return `no castelo de ${CIV_DEFS[p.home.civ].short}`;
    if (p.rank === 'ruler' && p.civ >= 0) return `${p.sex === 'f' ? 'rainha' : 'rei'} de ${CIV_DEFS[p.civ].short}`;
    if (p.prof && typeof PROFESSIONS !== 'undefined' && PROFESSIONS[p.prof]) return p.sex === 'f' ? PROFESSIONS[p.prof].f : PROFESSIONS[p.prof].name;
    return '';
  },
  node(p, cls, extra) {
    const esc = UI.esc.bind(UI), dead = !p.alive && !p.becamePlayer, ic = p.becamePlayer ? '👑' : p.rank === 'heir' || p.rank === 'ruler' ? (p.sex === 'f' ? '👸' : '🤴') : p.age < 14 ? '🧒' : p.sex === 'f' ? '👩' : '👨';
    const w = this.where(p);
    return `<div class="lg-node ${cls || ''} ${dead ? 'dead' : ''} ${p.sex === 'f' ? 'f' : 'm'}"><span class="lg-ic">${dead ? '✝' : ic}</span><b>${esc(p.name)}</b><small>${dead ? 'morreu' : p.becamePlayer ? 'herói' : `${p.age} anos`}${w ? ' · ' + esc(w) : ''}</small>${extra || ''}</div>`;
  },
  heroNode(G0, h) {
    const esc = UI.esc.bind(UI), k = h.hero, crown = k.kingdoms && k.kingdoms.length;
    return `<div class="lg-node hero ${h.now ? 'now' : ''} ${k.sex === 'f' ? 'f' : 'm'}"><span class="lg-num">${ROMAN[h.g] || h.g + 1}</span><span class="lg-ic">${crown ? '👑' : '🗺️'}</span><b>${esc(k.name)} ${esc(G.surname || '')}</b>
      <small>${h.now ? `${k.age} anos · você` : `viveu ${k.age} anos${k.cause ? ' · ' + esc(k.cause) : ''}`}${crown ? ' · ' + esc(k.kingdoms.join(', ')) : ''}</small></div>`;
  },
  html() {
    const T = this.tree(), esc = UI.esc.bind(UI);
    const rows = T.map(h => {
      const couple = `<div class="lg-couple">${this.heroNode(G, h)}${h.spouse ? `<span class="lg-heart">❤</span>${this.node(h.spouse, 'spouse')}` : ''}</div>`;
      const kids = h.kids.length ? `<div class="lg-kids">${h.kids.map(k => `<div class="lg-kid ${k.heir ? 'heir' : ''}">${this.node(k.p, k.heir ? 'heir' : '', k.heir ? '<em class="lg-next">↓ continuou a história</em>' : '')}${k.grand.length ? `<div class="lg-grand">${k.grand.slice(0, 6).map(q => `<span class="${q.alive ? '' : 'dead'}">${q.alive ? (q.age < 14 ? '🧒' : q.sex === 'f' ? '👩' : '👨') : '✝'} ${esc(q.name)}</span>`).join('')}${k.grand.length > 6 ? `<span>+${k.grand.length - 6}</span>` : ''}</div>` : ''}</div>`).join('')}</div>`
        : `<div class="lg-kids empty"><small class="muted">${h.now ? 'Ainda sem filhos.' : 'Sem filhos registrados.'}</small></div>`;
      return `<div class="lg-gen"><div class="lg-glab">${h.g + 1}ª geração</div>${couple}${kids}</div>`;
    }).join('<div class="lg-link"></div>');
    const alive = T.reduce((a, h) => a + h.kids.filter(k => k.p.alive).length, 0);
    return `<div class="lg-head">${G.mainRealm !== null && G.mainRealm !== undefined && G.civs[G.mainRealm] ? Heraldry.armsSvg(G.mainRealm, 48) : '<span class="lg-shield">🛡️</span>'}<div><h3>Casa ${esc(G.surname || '')}</h3><small>${T.length} ${T.length === 1 ? 'geração' : 'gerações'} · ${alive} ${alive === 1 ? 'filho vivo' : 'filhos vivos'} na família</small></div></div><div class="lg-tree">${rows}</div>`;
  },
  // a página do livro: a linha dos heróis, curta
  bookPage() {
    const T = this.tree(), esc = UI.esc.bind(UI);
    return `<div class="bk-tree"><div class="bk-illu">🌳</div><h2>A árvore da Casa ${esc(G.surname || '')}</h2>${T.map(h => `<div class="bk-tg"><b>${ROMAN[h.g] || h.g + 1}. ${esc(h.hero.name)}</b>${h.spouse ? ` <span>❤ ${esc(h.spouse.name)}</span>` : ''}<small>${h.kids.length ? `${h.kids.length} ${h.kids.length === 1 ? 'filho' : 'filhos'}: ${h.kids.map(k => esc(k.p.name) + (k.heir ? ' 👑' : '')).join(', ')}` : 'sem filhos'}</small></div>`).join('<div class="bk-tl">│</div>')}
      <div class="act-row"><button class="primary" data-act="lineage">🌳 Ver a árvore inteira</button></div></div>`;
  },
};
UI.showLineage = function () { this.open('🌳 Árvore da dinastia', Lineage.html(), 'showLineage', [], `Casa ${G.surname || ''}`); };

{
  // filhos nascidos a partir de agora já sabem de qual geração são
  const b0 = Game.birth.bind(Game);
  Game.birth = function (...a) { const n = G.people.length, r = b0(...a); for (const p of G.people.slice(n)) if (p.parents && p.parents[0] === 'player') p.heroGen = (G.dynasty || []).length; return r; };
  // o cônjuge do herói fica anotado antes de o herdeiro assumir
  const ca0 = Game.continueAs.bind(Game);
  Game.continueAs = function (id) { if (G.family && G.family.spouse !== null) Lineage.L().spouse[(G.dynasty || []).length] = G.family.spouse; return ca0(id); };
  // no livro: a página da árvore logo depois da capa
  const pg0 = Book.pages.bind(Book);
  Book.pages = function () { const p = pg0(); p.splice(1, 0, Lineage.bookPage()); return p; };
  // no Portfólio, a página Linhagens ganha o botão
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { const h = kp0(nav); return nav === 'tree' ? `<div class="act-row lg-open"><button class="primary" data-act="lineage">🌳 Árvore da dinastia</button></div>` + h : h; };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'lineage') { UI.showLineage(); return; } return a0(a, d); };
}
