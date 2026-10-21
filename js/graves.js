'use strict';
// Cemitérios: cada reino tem um, perto do castelo. Quem é da sua família (filhos, cônjuge, pais, irmãos,
// gente da sua casa) e os heróis da dinastia são enterrados ali, com uma lápide que resume a vida da pessoa.

const EPITAPHS = {
  gentil: 'Sua bondade aqueceu todos que estiveram por perto.',
  alegre: 'Riu da vida até o último dia.',
  rabugento: 'Reclamava de tudo, mas nunca faltou a ninguém.',
  timido: 'Falava pouco e amava muito.',
  orgulhoso: 'Honrou o nome da família até o fim.',
  ganancioso: 'Contou cada moeda. Agora descansa em paz.',
  romantico: 'Viveu para amar.',
  leal: 'Palavra dada, palavra cumprida.',
  corajoso: 'Nunca recuou diante do perigo.',
  desconfiado: 'Desconfiou do mundo, mas confiou na família.',
};

const Graves = {
  list() { return G.graves || (G.graves = []); },
  inCiv(ci) { return this.list().filter(g => g.civ === ci); },
  // é da família do herói? (filhos, pais, irmãos, cônjuge, gente da casa e antigos heróis)
  isFamily(p) { return !!p && (!!p.kin || p.spouse === 'player' || (G.playerFam !== undefined && G.playerFam !== null && p.fam === G.playerFam) || !!p.becamePlayer); },
  nearestCiv(x, y) {
    let best = 0, bd = 1e9;
    World.capitals.forEach((c, i) => { if (!c || !G.civs[i]) return; const d = U.dist(x, y, c.x, c.y); if (d < bd) { bd = d; best = i; } });
    return best;
  },
  // em que reino a pessoa descansa
  civFor(p) {
    const h = p.home || {};
    if (h.type === 'village' && World.villages[h.idx]) { const v = World.villages[h.idx]; return v.free ? this.nearestCiv(v.x, v.y) : v.civ; }
    if (h.type === 'castle' && h.civ >= 0) return h.civ;
    if (h.type === 'player') { const ci = G.mainRealm; if (ci !== undefined && ci !== null && G.civs[ci] && G.civs[ci].ruler === 'player') return ci; return this.nearestCiv(G.spawn.x / TILE, G.spawn.y / TILE); }
    return p.civ >= 0 && G.civs[p.civ] ? p.civ : this.nearestCiv(P.x / TILE, P.y / TILE);
  },
  nameOf(id) { if (id === 'player') return G.name; const q = G.people[id]; return q ? q.name : null; },
  // enterra alguém da família, com o resumo da vida
  add(p, cause) {
    if (!p || this.list().some(g => g.pid === p.id)) return;
    const cd = Calendar.of(G.day), lines = [];
    const rel = People.relation(p).text, ps = (p.parents || []).map(id => this.nameOf(id)).filter(Boolean);
    if (ps.length) lines.push(`${p.sex === 'f' ? 'Filha' : 'Filho'} de ${ps.join(' e ')}.`);
    const sp = p.spouse === 'player' ? G.name : p.spouse !== null && p.spouse !== undefined ? this.nameOf(p.spouse) : null;
    if (sp) lines.push(`${p.sex === 'f' ? 'Casada' : 'Casado'} com ${sp}.`);
    const kids = (p.children || []).length;
    if (kids) lines.push(`Deixou ${kids} ${kids === 1 ? (G.people[p.children[0]] && G.people[p.children[0]].sex === 'f' ? 'filha' : 'filho') : 'filhos'}.`);
    if (p.prof && PROFESSIONS[p.prof]) lines.push(`Profissão: ${PROFESSIONS[p.prof].name}.`);
    else if (p.rank && RANKS[p.rank] && !['child', 'peasant'].includes(p.rank)) lines.push(`Foi ${People.title(p).toLowerCase()}.`);
    if (p.kills) lines.push(`Venceu ${p.kills} ${p.kills === 1 ? 'combate' : 'combates'}.`);
    if (p.capanga || p.oldHome) lines.push('Lutou ao lado da família.');
    lines.push(`Morreu ${cause || 'de causas naturais'}, em ${Calendar.full(G.day)}.`);
    this.list().push({ pid: p.id, name: People.full(p), sex: p.sex, age: p.age, born: cd.year - p.age, year: cd.year, day: G.day, rel, title: People.title(p),
      lines, epitaph: EPITAPHS[p.trait] || 'Descanse em paz.', civ: this.civFor(p), kind: 'family' });
  },
  // o herói da dinastia
  addHero(cause) {
    const cd = Calendar.of(G.day), st = G.stats || {}, lines = [];
    const kills = Object.keys(st).filter(k => k.startsWith('kill_')).reduce((a, k) => a + st[k], 0);
    const realms = G.civs.filter(c => c.ruler === 'player').map(c => CIV_DEFS[c.id].short);
    lines.push(`Herói${P.sex === 'f' ? 'na' : ''} da Casa ${G.surname}, nível ${P.level}.`);
    if (realms.length) lines.push(`Governou ${realms.join(', ')}.`);
    if (G.usurper && Object.keys(G.usurper).length) lines.push('Tomou uma coroa como usurpador.');
    const titles = Object.keys(G.civilTitles || {}); if (titles.length) lines.push(`Títulos: ${titles.length}.`);
    const sp = G.family && G.family.spouse !== null ? this.nameOf(G.family.spouse) : null; if (sp) lines.push(`Casad${P.sex === 'f' ? 'a' : 'o'} com ${sp}.`);
    const kids = G.people.filter(q => q.parents && q.parents.includes('player')).length; if (kids) lines.push(`Teve ${kids} ${kids === 1 ? 'filho' : 'filhos'}.`);
    if (kills) lines.push(`Venceu ${kills} combates.`);
    const ach = Object.keys(G.ach || {}).length; if (ach) lines.push(`${ach} conquistas.`);
    lines.push(`Morreu ${cause || 'em combate'}, em ${Calendar.full(G.day)}.`);
    const ci = realms.length && G.mainRealm !== undefined && G.mainRealm !== null && G.civs[G.mainRealm] && G.civs[G.mainRealm].ruler === 'player' ? G.mainRealm : this.nearestCiv(P.x / TILE, P.y / TILE);
    this.list().push({ pid: 'hero' + (G.dynasty || []).length, name: `${G.name} ${G.surname}`, sex: P.sex, age: P.age, born: cd.year - P.age, year: cd.year, day: G.day,
      rel: 'Herói da dinastia', title: realms.length ? (P.sex === 'f' ? 'Rainha' : 'Rei') : 'Aventureir' + (P.sex === 'f' ? 'a' : 'o'), lines,
      epitaph: realms.length ? 'Sua coroa passou adiante; seu nome, nunca.' : 'Andou por todos os caminhos dos sete reinos.', civ: ci, kind: 'hero' });
  },
  // um cemitério perto de cada castelo (o mesmo lugar sempre que o jogo é carregado)
  place() {
    World.capitals.forEach((cp, ci) => {
      if (!cp || World.structs.some(s => s && s.type === 'cemetery' && s.owner === ci && !s.removed)) return;
      // o rei mudou o cemitério de lugar: ele volta para onde foi posto
      const sv = this.saved(ci);
      if (sv && !this.spotErr(null, sv.x, sv.y, true)) {
        for (let j = sv.y; j < sv.y + 4; j++) for (let i = sv.x; i < sv.x + 6; i++) World.obj[World.idx(i, j)] = 0;
        World.addStruct('cemetery', sv.x, sv.y, 6, 4, ci);
        return;
      }
      let best = null;
      // primeiro bem perto do castelo, dentro do reino e longe das estradas; se não couber, um pouco mais longe
      for (const [r0, r1, strict] of [[9, 18, true], [9, 28, false], [8, 42, null]]) {
        let bd = 1e9;
        for (let y = cp.y - r1; y <= cp.y + r1; y++) for (let x = cp.x - r1; x <= cp.x + r1; x++) {
          const d = U.dist(x + 3, y + 2, cp.x, cp.y);
          if (d < r0 || d > r1 || d >= bd) continue;
          const m = strict === null ? 0 : 1; // última tentativa: sem folga em volta
          if (!World.areaOk(x - m, y - m, 6 + 2 * m, 4 + 2 * m) || !World.areaFree(x - m, y - m, 6 + 2 * m, 4 + 2 * m)) continue;
          if (strict && (Towns.onRoad(x, y, 6, 4) || World.terr[World.idx(x + 3, y + 2)] !== ci)) continue;
          if (strict === false && Towns.onRoad(x + 1, y + 1, 4, 2)) continue;
          if (strict === null && [0, 1, 2, 3].some(j => [0, 1, 2, 3, 4, 5].some(i => { const t = World.tile(x + i, y + j); return t === T.ROAD || t === T.BRIDGE; }))) continue;
          bd = d; best = { x, y };
        }
        if (best) break;
      }
      if (!best) return;
      for (let j = best.y; j < best.y + 4; j++) for (let i = best.x; i < best.x + 6; i++) World.obj[World.idx(i, j)] = 0;
      World.addStruct('cemetery', best.x, best.y, 6, 4, ci);
    });
    World.chunks = new Map();
  },
  // onde o rei pôs o cemitério (guardado no jogo salvo)
  saved(ci) { return ((G.urban || {}).cem || {})[ci] || null; },
  // o cemitério pode ir para qualquer lugar do mapa: só precisa de chão firme e livre (árvores e pedras são retiradas)
  spotErr(s, tx, ty, loading) {
    for (let y = ty; y < ty + 4; y++) for (let x = tx; x < tx + 6; x++) {
      if (!World.inb(x, y)) return 'Fora do mapa';
      const i = World.idx(x, y), t = World.tiles[i];
      if (!TINFO[t].walk || t === T.WATER || t === T.BRIDGE) return 'Terreno inválido (água ou montanha)';
      if (t === T.ROAD) return 'Não ponha sobre a estrada';
      const b = World.blocker(i); if (b && (!s || b.id !== s.id)) return 'Já há uma construção aqui';
    }
    if (!loading && P.x + P.r > tx * TILE && P.x - P.r < (tx + 6) * TILE && P.y > ty * TILE && P.y - P.r < (ty + 4) * TILE) return 'Você está no caminho';
    return null;
  },
  flowers(i) {
    const g = this.list()[i]; if (!g) return;
    if (g.flowers === G.day) { UI.msg('Você já deixou flores aqui este mês.'); return; }
    g.flowers = G.day; Faith.addPiety(1);
    UI.msg(`🌹 Você deixou flores no túmulo de ${g.name}.`, 'gold');
  },
};
CIV_STRUCTS.cemetery = { name: 'Cemitério', blocks: false };

// janela do cemitério: as lápides do reino e o resumo da vida de quem está ali
UI.showCemetery = function (ci) {
  const all = Graves.inCiv(ci).slice().sort((a, b) => b.day - a.day), sel = U.clamp(this.sel.grave || 0, 0, Math.max(0, all.length - 1));
  const g = all[sel], idx = g ? Graves.list().indexOf(g) : -1;
  const stones = all.map((x, k) => `<button class="cem-stone ${k === sel ? 'on' : ''} ${x.kind === 'hero' ? 'hero' : ''}" data-act="cemsel" data-c="${ci}" data-k="${k}">
      <span class="cem-cross">${x.kind === 'hero' ? '👑' : '✝'}</span><b>${this.esc(x.name.split(' ')[0])}</b><small>${x.born > 0 ? x.born + " – " + x.year : "ano " + x.year}</small>${x.flowers !== undefined ? '<em>🌹</em>' : ''}</button>`).join('');
  const detail = g ? `<div class="cem-detail"><div class="cem-big ${g.kind === 'hero' ? 'hero' : ''}"><span>${g.kind === 'hero' ? '👑' : '✝'}</span>
      <b>${this.esc(g.name)}</b><small>${g.born > 0 ? `Ano ${g.born} – ano ${g.year}` : `Faleceu no ano ${g.year}`} · viveu ${g.age} ${g.age === 1 ? 'ano' : 'anos'}</small><i>${this.esc(g.title)} · ${this.esc(g.rel)}</i></div>
      <blockquote>“${this.esc(g.epitaph)}”</blockquote>
      <ul class="cem-life">${g.lines.map(l => `<li>${this.esc(l)}</li>`).join('')}</ul>
      <div class="act-row"><button class="primary" data-act="cemflower" data-i="${idx}" ${g.flowers === G.day ? 'disabled' : ''}>🌹 Deixar flores</button></div></div>`
    : '<div class="cem-detail"><p class="muted">Ninguém da sua família descansa aqui ainda.</p><small class="muted">Quando alguém da família morrer, é enterrado no cemitério do reino onde vivia, com uma lápide que conta a sua vida.</small></div>';
  const others = Graves.list().filter(x => x.civ !== ci).length;
  const h = `<div class="cem-layout"><div class="card cem-list"><div class="sec">Lápides <span>${all.length}</span></div><div class="cem-stones">${stones || '<p class="muted">Nenhuma lápide da família.</p>'}</div>
    ${others ? `<small class="muted">Mais ${others} ${others === 1 ? 'parente descansa' : 'parentes descansam'} em outros reinos.</small>` : ''}</div>${detail}</div>`;
  this.open('⚰️ Cemitério de ' + CIV_DEFS[ci].short, h, 'showCemetery', [ci], 'Visite os seus familiares que já partiram');
};

// mudar o cemitério de lugar: o rei do reino pode pô-lo em qualquer lugar do mapa (dentro ou fora do reino, perto ou longe
// das vilas), pelo Construir → Obras → Mudar de lugar. As lápides vão junto.
{
  const mv0 = Urban.movable.bind(Urban);
  Urban.movable = function (s) {
    if (s && s.type === 'cemetery') return G.civs[s.owner] && G.civs[s.owner].ruler === 'player' ? null : `Só quem governa ${CIV_DEFS[s.owner].name} pode mudar o cemitério de lugar.`;
    return mv0(s);
  };
  const pe0 = Urban.placeErr.bind(Urban);
  Urban.placeErr = function (def, tx, ty, s, civic) { return s && s.type === 'cemetery' ? Graves.spotErr(s, tx, ty) : pe0(def, tx, ty, s, civic); };
  const rl0 = Urban.relocate.bind(Urban);
  Urban.relocate = function (s, nx, ny, quiet) {
    const r = rl0(s, nx, ny, quiet);
    if (s.type === 'cemetery') { const u = G.urban || (G.urban = {}); (u.cem || (u.cem = {}))[s.owner] = { x: s.x, y: s.y }; }
    return r;
  };
}
