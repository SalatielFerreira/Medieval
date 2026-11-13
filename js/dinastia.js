'use strict';
// A Árvore da dinastia e o Placar da dinastia, redesenhados:
//  • 🌳 Árvore: as gerações lado a lado, como uma linha do tempo da Casa — cada geração num cartão com o herói, o
//    cônjuge e os filhos (o herdeiro marcado com 👑 e a seta para a geração seguinte), cabendo na janela.
//  • 🏆 Placar: o pódio das gerações (pontos), e cada geração numa barra com o que ela conquistou (reinos, vilas,
//    batalhas, filhos...) — o melhor de cada coisa em dourado — e como os pontos são contados.
const Dinastia = {
  esc(s) { return UI.esc(s); },
  face(p) { return p.alive === false && !p.becamePlayer ? '✝' : p.becamePlayer ? '👑' : p.age < 14 ? '🧒' : p.sex === 'f' ? '👩' : '👨'; },
  arms(sz) { return G.mainRealm !== null && G.mainRealm !== undefined && G.civs[G.mainRealm] ? Heraldry.armsSvg(G.mainRealm, sz) : `<span class="dn-shield" style="width:${sz}px;height:${Math.round(sz * 1.15)}px">${this.esc((G.surname || '?')[0])}</span>`; },
  tree() {
    const T = Lineage.tree(), esc = this.esc.bind(this), n = T.length, alive = T.reduce((a, h) => a + h.kids.filter(k => k.p.alive).length, 0);
    const KMAX = n > 4 ? 3 : 5;
    const gens = T.map(h => {
      const k = h.hero, crown = k.kingdoms && k.kingdoms.length;
      const kids = h.kids.slice(0, KMAX).map(x => `<${x.p.alive ? 'button' : 'div'} class="dn-kid ${x.heir ? 'heir' : ''} ${x.p.alive ? '' : 'dead'} ${x.p.sex === 'f' ? 'f' : 'm'}" ${x.p.alive && !x.p.becamePlayer ? `data-act="tk" data-op="open" data-id="${x.p.id}"` : ''}>
          <span>${x.heir ? '👑' : this.face(x.p)}</span><b>${esc(x.p.name)}</b><small>${x.heir ? 'herdeiro' : x.p.alive ? `${x.p.age} anos` : '✝'}${x.grand && x.grand.length ? ` · ${x.grand.length} ${x.grand.length === 1 ? 'neto' : 'netos'}` : ''}</small></${x.p.alive ? 'button' : 'div'}>`).join('')
        + (h.kids.length > KMAX ? `<div class="dn-more">+${h.kids.length - KMAX} filhos</div>` : '');
      return `<div class="dn-gen ${h.now ? 'now' : ''}"><div class="dn-num">${ROMAN[h.g] || h.g + 1}</div><small class="dn-glab">${h.g + 1}ª geração${h.now ? ' · agora' : ''}</small>
        <div class="dn-hero ${k.sex === 'f' ? 'f' : 'm'}"><span>${crown ? '👑' : '🗺️'}</span><b>${esc(k.name)}</b><small>${h.now ? `${k.age} anos · você` : `viveu ${k.age} anos`}</small>${crown ? `<i>${esc(k.kingdoms.join(', '))}</i>` : ''}</div>
        <div class="dn-sp">${h.spouse ? `❤ ${esc(h.spouse.name)}` : '<span class="muted">sem cônjuge</span>'}</div>
        <div class="dn-kids">${kids || `<small class="muted">${h.now ? 'ainda sem filhos' : 'sem filhos registrados'}</small>`}</div></div>`;
    }).join('<div class="dn-arrow">➜</div>');
    return `<div class="dn"><div class="dn-top">${this.arms(46)}<div><small>A dinastia</small><h3>Casa ${esc(G.surname || '')}</h3></div>
        <div class="dn-chips"><span><b>${n}</b> gerações</span><span><b>${alive}</b> filhos vivos</span><span><b>${T.reduce((a, h) => a + h.kids.reduce((b, x) => b + (x.grand ? x.grand.length : 0), 0), 0)}</b> netos</span></div>
        <div class="dn-acts"><button data-act="legacy">🏆 Placar da dinastia</button></div></div>
      <div class="dn-line">${gens}</div></div>`;
  },
  score() {
    const rows = Legacy.rows(), esc = this.esc.bind(this), sc = rows.map(x => x.r ? Legacy.score(x.r) : 0), top = Math.max(1, ...sc);
    const best = {}; for (const [k] of LEGACY_COLS) best[k] = Math.max(0, ...rows.filter(x => x.r).map(x => x.r[k] || 0));
    const order = rows.map((x, i) => ({ x, s: sc[i], i })).sort((a, b) => b.s - a.s || (b.x.r ? 1 : 0) - (a.x.r ? 1 : 0) || (b.x.now ? 1 : 0) - (a.x.now ? 1 : 0)), pos = order.findIndex(o => o.x.now) + 1;
    const pod = [1, 0, 2].map(i => order[i]).map((o, j) => o ? `<div class="dn-pod p${[2, 1, 3][j]} ${o.x.now ? 'now' : ''}"><span>${['🥈', '🥇', '🥉'][j]}</span><b>${ROMAN[o.x.g] || o.x.g + 1}. ${esc(o.x.name)}</b><em>${o.s.toLocaleString('pt-BR')} pts</em><u></u></div>` : '<span></span>').join('');
    const bars = rows.map((x, i) => `<div class="dn-row ${x.now ? 'now' : ''}"><div class="dn-rn"><b>${ROMAN[x.g] || x.g + 1}. ${esc(x.name)}</b><small>${x.now ? `${x.age} anos · agora` : `viveu ${x.age} anos`}</small></div>
        <div class="dn-rb"><i style="width:${Math.round(sc[i] / top * 100)}%"></i><em>${x.r ? sc[i].toLocaleString('pt-BR') + ' pts' : 'sem registro'}</em></div>
        <div class="dn-rc">${LEGACY_COLS.map(([k, ic, nm]) => { const v = x.r ? x.r[k] || 0 : 0; return v ? `<span class="${v === best[k] && rows.length > 1 ? 'best' : ''}" title="${nm}">${ic} ${v.toLocaleString('pt-BR')}</span>` : ''; }).join('') || '<small class="muted">nada ainda</small>'}</div></div>`).join('');
    return `<div class="dn"><div class="dn-top">${this.arms(46)}<div><small>Placar da dinastia</small><h3>Casa ${esc(G.surname || '')}</h3></div>
        <div class="dn-chips"><span>a geração de agora está em <b>${pos}º lugar</b> de ${rows.length}</span></div><div class="dn-acts"><button data-act="lineage">🌳 Árvore da dinastia</button></div></div>
      <div class="dn-sc"><div class="card dn-podc"><div class="sec">🏆 O pódio das gerações</div><div class="dn-pods">${pod}</div>
          <div class="sec" style="margin-top:8px">📐 Como os pontos são contados</div><div class="dn-pts">${LEGACY_COLS.map(([, ic, nm, w]) => `<span>${ic} ${nm} <b>${w >= 1 ? w : '1 a cada ' + Math.round(1 / w)}</b></span>`).join('')}</div></div>
        <div class="card dn-bars"><div class="sec">📜 Cada geração <span>dourado = o melhor da Casa</span></div><div class="dn-list">${bars}</div></div></div></div>`;
  },
};
if (!WIDE_PANELS.includes('showLineage')) WIDE_PANELS.push('showLineage');
if (!WIDE_PANELS.includes('showLegacy')) WIDE_PANELS.push('showLegacy');
UI.showLineage = function () { this.open('🌳 Árvore da dinastia', Dinastia.tree(), 'showLineage', [], `Casa ${G.surname || ''}`); };
UI.showLegacy = function () { this.open('🏆 Placar da dinastia', Dinastia.score(), 'showLegacy', [], `Casa ${G.surname || ''}`); };
