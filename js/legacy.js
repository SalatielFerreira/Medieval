'use strict';
// Conquistas novas e o placar da dinastia.
//  • 🏆 Conquistas para as coisas novas: masmorras fundas, lendários, guardiões, tesouros, mapa explorado, cargas a
//    cavalo, bando fiel, casamentos de capangas, tratados, tributos, ações na Bolsa, Jogos, invernos e fama.
//  • 📊 Placar da dinastia: o que cada geração alcançou (reinos, vilas, batalhas, inimigos vencidos, tesouros,
//    construções, filhos, conquistas, fama e ouro), lado a lado com as anteriores, com pontos e o melhor de cada coluna.
const LEGACY_COLS = [
  // [chave, ícone, nome, pontos por unidade]
  ['kingdoms', '👑', 'Reinos', 400], ['villages', '🏘️', 'Vilas', 120], ['battles', '⚔️', 'Batalhas', 60], ['kills', '💀', 'Inimigos', 1],
  ['treasures', '💰', 'Tesouros', 25], ['built', '🏗️', 'Construções', 3], ['children', '👶', 'Filhos', 40], ['ach', '🏆', 'Conquistas', 30],
  ['fame', '⭐', 'Fama', 1], ['gold', '🪙', 'Ouro', 0.01],
];

ACHIEVEMENTS.push(
  { id: 'deep',       icon: '🕳️', name: 'Desbravador das Profundezas', desc: 'Chegue ao último andar de uma caverna.', t: () => Object.values(G.dungeons || {}).some(d => (d.deep || 1) >= 3) },
  { id: 'guardians',  icon: '🗝️', name: 'Quebra-Guardiões',           desc: 'Derrote 5 guardiões de andar.',        t: s => (s.guardians || 0) >= 5 },
  { id: 'legend',     icon: '✨', name: 'Portador de Lendas',          desc: 'Conquiste um item lendário.',          t: () => Object.keys(G.legends || {}).length >= 1 },
  { id: 'legend4',    icon: '🌟', name: 'Colecionador de Lendas',      desc: 'Conquiste os quatro itens lendários.', t: () => Object.keys(G.legends || {}).length >= 4 },
  { id: 'treasure3',  icon: '🗺️', name: 'Caçador de Tesouros',         desc: 'Desenterre 3 tesouros de mapas.',      t: s => (s.treasures || 0) >= 3 },
  { id: 'explorer',   icon: '🧭', name: 'Cartógrafo',                  desc: 'Conheça metade do mapa.',              t: () => !!G.fogOn && typeof Fog !== 'undefined' && Fog.pct() >= 50 },
  { id: 'charges',    icon: '🐎', name: 'Cavaleiro de Carga',          desc: 'Dê 10 cargas a cavalo.',               t: s => (s.charges || 0) >= 10 },
  { id: 'loyalband',  icon: '🤝', name: 'Bando Fiel',                  desc: 'Tenha 3 capangas com lealdade 80+.',   t: () => G.people.filter(p => p.alive && p.capanga && (p.loyal || 0) >= 80).length >= 3 },
  { id: 'cupid',      icon: '💕', name: 'Cupido do Bando',             desc: 'Dois capangas seus se casam.',         t: s => (s.compWed || 0) >= 1 },
  { id: 'royalwed',   icon: '💍', name: 'Aliança de Sangue',           desc: 'Case um filho com o herdeiro de um reino.', t: () => typeof Pacts !== 'undefined' && Pacts.S().wed.some(w => w.mine) },
  { id: 'traders',    icon: '📦', name: 'Rota das Especiarias',        desc: 'Tenha 3 tratados de comércio ao mesmo tempo.', t: () => typeof Pacts !== 'undefined' && Pacts.main() >= 0 && Pacts.S().trade.filter(t => t.a === Pacts.main() || t.b === Pacts.main()).length >= 3 },
  { id: 'vassals',    icon: '💰', name: 'Senhor de Vassalos',          desc: 'Receba tributo de 2 reinos.',          t: () => typeof Pacts !== 'undefined' && Pacts.S().trib.filter(t => G.civs[t.to] && G.civs[t.to].ruler === 'player').length >= 2 },
  { id: 'investor',   icon: '📊', name: 'Investidor',                  desc: 'Tenha ações das 5 companhias da Bolsa.', t: () => typeof Bolsa !== 'undefined' && Object.keys(Bolsa.X().own).length >= 5 },
  { id: 'champion',   icon: '🥇', name: 'Campeão dos Sete Reinos',     desc: 'Ganhe uma medalha de ouro nos Jogos.', t: () => typeof Games !== 'undefined' && (Games.S().history || []).some(h => Object.values(h.ev || {}).some(L => L && L[0] && L[0].who === 'player')) },
  { id: 'winters3',   icon: '🥶', name: 'Coração de Gelo',             desc: 'Sobreviva a 3 invernos.',              t: s => (s.winters || 0) >= 3 },
  { id: 'famous',     icon: '⭐', name: 'Nome nas Canções',            desc: 'Chegue a 200 de fama.',                t: () => (G.fame || 0) >= 200 },
);

const Legacy = {
  // os números de agora (somados desde o começo do jogo)
  totals() {
    const s = Progress.S(), kills = Object.entries(s).filter(([k]) => k.startsWith('kill_')).reduce((a, [, n]) => a + (n || 0), 0);
    return { battles: s.battlesWon || 0, kills, treasures: (s.treasures || 0) + (s.chests || 0), built: s.built || 0, children: s.children || 0, ach: Object.keys(G.ach || {}).length, fame: G.fame || 0 };
  },
  // o que a geração de agora fez (a diferença desde que ela começou)
  now() {
    const T = this.totals(), B = G.genStart || {}, out = {};
    for (const k of Object.keys(T)) out[k] = Math.max(0, T[k] - (B[k] || 0));
    out.kingdoms = G.civs.filter(c => c.ruler === 'player').length;
    out.villages = Urban.myVillages().length;
    out.gold = Math.round(P.gold);
    return out;
  },
  score(r) { return Math.round(LEGACY_COLS.reduce((a, [k, , , w]) => a + (r[k] || 0) * w, 0)); },
  rows() {
    const out = (G.dynasty || []).map((d, i) => ({ g: i, name: d.name, age: d.age, r: d.legacy || null }));
    out.push({ g: out.length, name: G.name, age: P.age, r: this.now(), now: true });
    return out;
  },
  html() {
    const rows = this.rows(), esc = UI.esc.bind(UI);
    const best = {}; for (const [k] of LEGACY_COLS) best[k] = Math.max(0, ...rows.filter(x => x.r).map(x => x.r[k] || 0));
    const sc = rows.map(x => x.r ? this.score(x.r) : null), top = Math.max(0, ...sc.filter(v => v !== null));
    const head = `<tr><th>Geração</th>${LEGACY_COLS.map(([, ic, nm]) => `<th title="${nm}">${ic}<small>${nm}</small></th>`).join('')}<th>Pontos</th></tr>`;
    const body = rows.map((x, i) => `<tr class="${x.now ? 'now' : ''}"><td><b>${ROMAN[x.g] || x.g + 1}. ${esc(x.name)}</b><small>${x.now ? `${x.age} anos · agora` : `viveu ${x.age} anos`}</small></td>
      ${LEGACY_COLS.map(([k]) => { const v = x.r ? x.r[k] || 0 : null; return `<td class="${v !== null && v > 0 && v === best[k] && rows.length > 1 ? 'best' : ''}">${v === null ? '—' : v.toLocaleString('pt-BR')}</td>`; }).join('')}
      <td class="pts ${sc[i] !== null && sc[i] === top && rows.length > 1 ? 'best' : ''}">${sc[i] === null ? '—' : sc[i].toLocaleString('pt-BR')}</td></tr>`).join('');
    const rank = rows.map((x, i) => ({ x, s: sc[i] })).filter(o => o.s !== null).sort((a, b) => b.s - a.s);
    const pos = rank.findIndex(o => o.x.now) + 1;
    return `<p class="dt-desc">O que cada geração da Casa ${esc(G.surname || '')} alcançou. 🏆 = o melhor de cada coluna. ${rows.length > 1 ? `A geração de agora está em <b>${pos}º lugar</b> de ${rank.length}.` : 'Quando o herdeiro assumir, as gerações aparecem lado a lado.'}</p>
      <div class="lgc-scroll"><table class="lgc">${head}${body}</table></div>
      <small class="muted">Pontos: reino 400 · vila 120 · batalha 60 · filho 40 · conquista 30 · tesouro 25 · construção 3 · inimigo 1 · fama 1 · ouro 1 a cada 100.</small>`;
  },
};
UI.showLegacy = function () { this.open('🏆 Placar da dinastia', Legacy.html(), 'showLegacy', [], `Casa ${G.surname || ''}`); };

{
  // a geração que termina leva o placar dela; a nova começa do zero
  const eh0 = Progress.endHero.bind(Progress);
  Progress.endHero = function (cause) {
    const r = Legacy.now();
    const out = eh0(cause);
    const d = G.dynasty && G.dynasty[G.dynasty.length - 1]; if (d) d.legacy = r;
    G.genStart = Legacy.totals();
    return out;
  };
  // capangas que casam contam para a conquista
  const mr0 = People.marry.bind(People);
  People.marry = function (a, b) { const r = mr0(a, b); if (a && b && a.capanga && b.capanga) Progress.add('compWed'); return r; };
  // no livro: o placar depois da árvore; na página Linhagens, o botão
  const pg0 = Book.pages.bind(Book);
  Book.pages = function () {
    const p = pg0(), rows = Legacy.rows(), sc = rows.map(x => x.r ? Legacy.score(x.r) : 0), mx = Math.max(1, ...sc);
    const page = `<div class="bk-tree"><div class="bk-illu">🏆</div><h2>O placar das gerações</h2>${rows.map((x, i) => `<div class="bk-tg"><b>${ROMAN[x.g] || x.g + 1}. ${UI.esc(x.name)}${x.now ? ' (agora)' : ''}</b><small>${x.r ? `${sc[i].toLocaleString('pt-BR')} pontos` : 'sem registro'}</small><span class="bk-bar"><i style="width:${Math.round(sc[i] / mx * 100)}%"></i></span></div>`).join('')}
      <div class="act-row"><button class="primary" data-act="legacy">🏆 Ver o placar completo</button></div></div>`;
    p.splice(2, 0, page);
    return p;
  };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { const h = kp0(nav); return nav === 'tree' ? h.replace('<button class="primary" data-act="lineage">🌳 Árvore da dinastia</button>', '<button class="primary" data-act="lineage">🌳 Árvore da dinastia</button><button data-act="legacy">🏆 Placar da dinastia</button>') : h; };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'legacy') { UI.showLegacy(); return; } return a0(a, d); };
}
