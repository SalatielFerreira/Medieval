// ====================================================================== heróis dos reinos
// Cada reino tem os seus guerreiros famosos: ganham um apelido ("o Bravo", "Mão de Ferro"...), fama, vitórias e uma lista
// de feitos. Lutam nas guerras (entre os reinos da IA, todo mês; nas suas batalhas, aparecem no campo ao lado do rei),
// podem cair em combate (viram lenda, com lápide e crônica) e são substituídos por novos heróis. Você conversa com eles
// como com qualquer pessoa, e os boatos dos feitos correm pelas vilas.
const HERO_PER = 3; // heróis vivos por reino
const HERO_EPI = [
  ['o Bravo', 'a Brava'], ['Mão de Ferro', 'Mão de Ferro'], ['o Leão', 'a Leoa'], ['Coração de Pedra', 'Coração de Pedra'], ['o Implacável', 'a Implacável'],
  ['Lança Rubra', 'Lança Rubra'], ['o Invicto', 'a Invicta'], ['Machado Negro', 'Machado Negro'], ['o Destemido', 'a Destemida'], ['Escudo de Bronze', 'Escudo de Bronze'],
  ['Olho de Falcão', 'Olho de Falcão'], ['o Lobo', 'a Loba'], ['o Gigante', 'a Valquíria'], ['Espada Sombria', 'Espada Sombria'], ['o Martelo', 'a Tempestade'],
  ['Matador de Ursos', 'Matadora de Ursos'], ['o Muralha', 'a Muralha'], ['o Vermelho', 'a Rubra'], ['Punho de Trovão', 'Punho de Trovão'], ['o Sem-Medo', 'a Sem-Medo'],
];
// feitos de guerra e de paz ({f} = reino inimigo, {v} = vila, {h} = herói inimigo)
const HERO_WAR = [
  'segurou a ponte de {v} sozinho contra a tropa de {f}', 'liderou a carga que rompeu a linha de {f}', 'defendeu {v} do ataque de {f}',
  'capturou o estandarte de {f}', 'emboscou os batedores de {f} na mata', 'salvou o capitão ferido no meio da batalha contra {f}',
  'escalou a paliçada de {f} à noite', 'derrubou três cavaleiros de {f} numa só investida',
];
const HERO_PEACE = [
  'venceu o torneio de {c}', 'matou uma alcateia de lobos perto de {v}', 'salvou uma caravana dos bandidos na estrada de {v}',
  'desafiou e venceu um mercenário famoso em {c}', 'treinou a nova guarda de {c}', 'caçou o urso que atacava os rebanhos de {v}',
  'destruiu um acampamento de bandidos perto de {v}', 'escoltou o tesouro do rei até {c} sem perder uma moeda',
];

const Heroes = {
  fallen() { return G.heroFallen || (G.heroFallen = []); },
  of(ci) { return G.people.filter(p => p.alive && p.hero && p.hero.civ === ci).sort((a, b) => b.hero.fame - a.hero.fame); },
  all() { return G.people.filter(p => p.alive && p.hero).sort((a, b) => b.hero.fame - a.hero.fame); },
  name(p) { return `${p.name} ${p.hero.epi}`; },
  rankName(p) { return p.hero.fame >= 150 ? 'Lenda' : p.hero.fame >= 80 ? 'Campeão' : 'Herói'; },
  civName(ci) { return CIV_DEFS[ci] ? CIV_DEFS[ci].short : '?'; },
  // um apelido que ninguém do mesmo reino usa
  epithet(p, ci) {
    const used = new Set(this.of(ci).map(q => q.hero.epi)), free = HERO_EPI.filter(e => !used.has(e[0]) && !used.has(e[1]));
    const e = U.pick(free.length ? free : HERO_EPI); return p.sex === 'f' ? e[1] : e[0];
  },
  // escolhe alguém do reino para virar herói (cavaleiros e soldados primeiro); sem ninguém, chega um soldado novo
  promote(ci, why) {
    const ok = p => p.alive && !p.hero && !p.capanga && !p.kin && p.spouse !== 'player' && p.age >= 18 && p.age <= 45 && !(p.jail > G.day);
    const cand = G.people.filter(p => ok(p) && ((p.rank === 'knight' && p.home.type === 'castle' && p.home.civ === ci) || (p.rank === 'soldier' && p.soldierOf === ci) || (p.rank === 'mercenary' && p.civ === ci)));
    let p = cand.length ? cand.sort((a, b) => (b.kills || 0) - (a.kills || 0) + (Math.random() - 0.5) * 20)[0] : null;
    if (!p) { p = People.create({ rank: 'soldier', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(20, 34), sex: Math.random() < 0.8 ? 'm' : 'f' }); p.soldierOf = ci; p.met = false; }
    Ranking.stats(p); p.str = Math.max(p.str, U.rint(70, 92));
    p.hero = { civ: ci, epi: this.epithet(p, ci), fame: U.rint(15, 35), wins: 0, battles: 0, kills: 0, deeds: [], since: G.day };
    this.deed(p, why || U.pick(['ganhou o apelido depois de vencer um duelo diante do rei', 'foi nomeado herói pelo rei depois de proteger a capital', 'sobreviveu sozinho a uma emboscada de bandidos']), 0);
    return p;
  },
  // completa os heróis de cada reino
  ensure() {
    if (!G.civs || !G.people) return;
    for (const c of G.civs) { if (!CIV_DEFS[c.id]) continue; let n = this.of(c.id).length; while (n++ < HERO_PER) this.promote(c.id); }
  },
  // anota um feito (fica nos 8 últimos) e espalha o boato pelas vilas do reino
  deed(p, text, fame, loud) {
    const h = p.hero; if (!h) return;
    h.deeds.unshift({ d: G.day, t: text }); if (h.deeds.length > 8) h.deeds.length = 8;
    h.fame = Math.max(0, h.fame + (fame || 0));
    const cap = World.capitals && World.capitals[h.civ];
    if (cap && typeof Rumors !== 'undefined' && fame) Rumors.add(`Dizem que ${this.name(p)}, de ${this.civName(h.civ)}, ${text}.`, cap.x, cap.y, { about: p.id });
    if (loud) Diplo.chronicle(`🏅 ${this.name(p)} (${this.civName(h.civ)}) ${text}.`, true);
  },
  fill(t, ci, foe) {
    const vs = Diplo.villagesOf(ci), cap = CIV_DEFS[ci] ? CIV_DEFS[ci].short : '';
    const v = vs.length ? U.pick(vs).name : cap;
    return t.replace('{f}', foe !== undefined ? this.civName(foe) : 'inimigos').replace('{v}', v).replace('{c}', cap);
  },
  // um herói caiu: vira lenda (crônica, lápide com o apelido, luto do reino)
  fall(p, cause, by) {
    if (!p.hero || p.hero.fell) return; p.hero.fell = true;
    this.fallen().unshift({ name: People.full(p), epi: p.hero.epi, civ: p.hero.civ, fame: p.hero.fame, wins: p.hero.wins, kills: p.hero.kills, day: G.day, age: p.age, cause: cause || 'em batalha', by: by || null, deeds: p.hero.deeds.slice(0, 3) });
    if (this.fallen().length > 24) this.fallen().length = 24;
    Diplo.chronicle(`⚰️ ${this.name(p)}, herói de ${this.civName(p.hero.civ)}, caiu ${cause || 'em batalha'}${by ? ` diante ${/^[ao] /.test(by) ? 'd' + by : 'de ' + by}` : ''}.`, true);
    const c = G.civs[p.hero.civ]; if (c) c.happy = Math.max(0, (c.happy || 50) - 3);
  },

  // ---------------------------------------------------------------- todo mês
  monthTick() {
    this.ensure();
    const D = Diplo.D();
    for (const w of D.wars) {
      const mine = War.mySide(w) !== null;
      for (const [ci, foe] of [[w.a, w.b], [w.b, w.a]]) {
        if (G.civs[ci] && G.civs[ci].ruler === 'player') continue; // os do seu reino lutam ao seu lado no campo de batalha
        for (const p of this.of(ci)) {
          if (Math.random() > (mine ? 0.25 : 0.45)) continue;
          p.hero.battles++;
          const foes = this.of(foe);
          // duelo entre heróis: o mais forte e famoso costuma vencer; quem perde morre
          if (foes.length && Math.random() < 0.1) {
            const q = U.pick(foes), sp = (p.str || 60) + p.hero.fame * 0.15 + U.rnd(0, 40), sq = (q.str || 60) + q.hero.fame * 0.15 + U.rnd(0, 40);
            const [wn, ls] = sp >= sq ? [p, q] : [q, p];
            wn.hero.wins++; wn.hero.kills++; wn.kills = (wn.kills || 0) + 1;
            this.deed(wn, `venceu ${this.name(ls)} em duelo diante dos dois exércitos`, 25, true);
            this.fall(ls, 'em duelo', this.name(wn)); People.die(ls, `em duelo contra ${this.name(wn)}`);
            continue;
          }
          const k = U.rint(1, 5); p.hero.kills += k; p.kills = (p.kills || 0) + k;
          if (Math.random() < 0.55) p.hero.wins++;
          this.deed(p, this.fill(U.pick(HERO_WAR), ci, foe), U.rint(5, 12));
          if (Math.random() < 0.04) { this.fall(p, 'em batalha', 'a tropa de ' + this.civName(foe)); People.die(p, 'em batalha contra ' + this.civName(foe)); }
        }
      }
    }
    // em tempo de paz também se fazem feitos
    for (const p of this.all()) {
      if (!p.alive || !G.civs[p.hero.civ]) continue;
      if (Math.random() < 0.08) this.deed(p, this.fill(U.pick(HERO_PEACE), p.hero.civ), U.rint(3, 8));
      if (p.age >= 58) { // velho demais para a guerra: pendura a espada e vira lenda viva
        this.deed(p, 'pendurou a espada depois de uma vida de batalhas', 0, true);
        p.legend = { epi: p.hero.epi, civ: p.hero.civ, fame: p.hero.fame }; delete p.hero;
      }
    }
    this.ensure();
  },

  // ---------------------------------------------------------------- no campo de batalha
  toBattle(ci, x0, cy, dir) {
    const B = G.place; if (!B || B.kind !== 'battle') return;
    const list = this.of(ci).filter(p => !p.capanga && !(p.jail > G.day)).slice(0, 2);
    list.forEach((p, k) => {
      const e = Game.spawn('guard', (x0 - dir * 2) * TILE, (cy + (k ? 3 : -3)) * TILE, { civ: ci, leash: 3, siegeOf: 999, mult: 2.2 + p.hero.fame / 120 });
      e.battle = B.id; e.wside = ci; e.aggroOv = 0; e.form = FORMATIONS.linha; e.home = { x: e.x, y: e.y };
      e.mounted = true; e.spMul = 1.4; e.noGarrison = true; e.heroP = p.id; e.name = '🏅 ' + this.name(p);
    });
    B.heroes = (B.heroes || []).concat(list.map(p => p.id));
  },
  // alguém caiu no campo: se era herói, guarda quem derrubou
  onKill(e, src) {
    const B = G.place;
    if (src && src.heroP !== undefined) { const p = G.people[src.heroP]; if (p && p.hero) { p.hero.kills++; p.kills = (p.kills || 0) + 1; } }
    if (e.heroP !== undefined && B && B.kind === 'battle') {
      const by = src === P ? G.name : src && src.heroP !== undefined && G.people[src.heroP] ? this.name(G.people[src.heroP]) : null;
      (B.heroFell = B.heroFell || []).push({ pid: e.heroP, by, player: src === P || (src && fac(src) === 'player') });
    }
  },
  afterBattle(B, win) {
    if (!B || B.fake) return;
    const fell = new Map((B.heroFell || []).map(f => [f.pid, f])), lines = [];
    for (const id of B.heroes || []) {
      const p = G.people[id]; if (!p || !p.alive || !p.hero) continue;
      const won = (p.hero.civ === B.side) === win, foe = p.hero.civ === B.side ? B.enemy : B.side;
      p.hero.battles++;
      const f = fell.get(id);
      if (f) {
        if (Math.random() < 0.6) { this.fall(p, 'no campo de batalha', f.by); People.die(p, 'no campo de batalha'); lines.push(`⚰️ ${this.name(p)} (${this.civName(p.hero.civ)}) caiu${f.by ? ' diante ' + (/^[ao] /.test(f.by) ? 'd' + f.by : 'de ' + f.by) : ''}.`); }
        else { this.deed(p, `foi carregado ferido do campo de batalha contra ${this.civName(foe)}`, 2); lines.push(`🩸 ${this.name(p)} saiu ferido.`); }
        if (f.player) { G.fame = (G.fame || 0) + 6; Progress.diary(`🏅 Derrubou ${this.name(p)}, herói de ${this.civName(p.hero.civ)}, no campo de batalha.`); }
        continue;
      }
      if (won) { p.hero.wins++; this.deed(p, `brilhou na vitória sobre ${this.civName(foe)}${p.hero.civ === B.side ? ` ao lado de ${G.name}` : ''}`, 15, true); lines.push(`🏅 ${this.name(p)} brilhou na vitória.`); }
      else this.deed(p, `lutou até o fim na derrota contra ${this.civName(foe)}`, 4);
    }
    if (lines.length) UI.msg('Heróis na batalha: ' + lines.join(' '), 'gold', true);
    this.ensure();
  },

  // ---------------------------------------------------------------- página (Diário → Heróis)
  page() {
    this.ensure();
    const esc = s => UI.esc(s), cut = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
    const card = p => {
      const h = p.hero, max = Math.max(150, ...this.all().map(q => q.hero.fame));
      return `<div class="hero-row" data-act="tk" data-op="open" data-id="${p.id}"><span class="hero-medal">${h.fame >= 150 ? '👑' : h.fame >= 80 ? '🥇' : '🏅'}</span>
        <div class="hero-main"><b>${esc(p.name)} <em>${esc(h.epi)}</em></b><small>${this.rankName(p)} · ${p.age} anos · ${h.battles} batalhas · ${h.wins} vitórias · ${h.kills} inimigos derrubados</small>
        <div class="hero-bar"><i style="width:${Math.round(Math.min(100, h.fame / max * 100))}%"></i></div>
        ${h.deeds.slice(0, 2).map(d => `<small class="hero-deed">• ${esc(cut(d.t, 90))} <span>${Calendar.short(d.d)}</span></small>`).join('')}</div><span class="hero-fame">${h.fame}<small>fama</small></span></div>`;
    };
    const civs = G.civs.filter(c => CIV_DEFS[c.id]).map(c => {
      const L = this.of(c.id), war = Diplo.warsOf(c.id).length;
      return `<div class="card hero-card"><div class="sec">${c.ruler === 'player' ? '👑 ' : ''}${esc(CIV_DEFS[c.id].name)} <span>${war ? '⚔️ em guerra' : '🕊️ em paz'}</span></div>${L.map(card).join('') || '<p class="muted">Nenhum herói.</p>'}</div>`;
    }).join('');
    const F = this.fallen();
    const legends = F.length ? `<div class="card hero-card"><div class="sec">⚰️ Lendas caídas <span>${F.length}</span></div>${F.slice(0, 10).map(f =>
      `<div class="hero-row dead"><span class="hero-medal">✝</span><div class="hero-main"><b>${esc(f.name)} <em>${esc(f.epi)}</em></b><small>${this.civName(f.civ)} · caiu ${esc(f.cause)}${f.by ? ' diante de ' + esc(f.by) : ''} em ${Calendar.short(f.day)} · ${f.wins} vitórias</small></div><span class="hero-fame">${f.fame}<small>fama</small></span></div>`).join('')}</div>` : '';
    const top = this.all()[0];
    return UI.pageHead('🏅', 'Heróis dos reinos', `${this.all().length} heróis vivos · clique num herói para conversar${top ? ` · o mais famoso: ${esc(this.name(top))}` : ''}`)
      + `<div class="card hero-you"><div class="sec">A sua fama <span>${G.fame || 0}</span></div><small>Vencer batalhas e derrubar heróis inimigos no campo de batalha aumenta a sua fama. Os heróis do seu reino lutam ao seu lado.</small></div>`
      + `<div class="hero-grid">${civs}${legends}</div>`;
  },
  // fala do herói na conversa
  line(p) {
    const h = p.hero; if (!h) return p.legend && Math.random() < 0.5 ? `Hoje sou só um velho. Mas me chamavam de ${p.legend.epi}, e ${this.civName(p.legend.civ)} ainda canta as minhas batalhas.` : null;
    if (Math.random() < 0.4) return null;
    const d = h.deeds[0];
    if (d && Math.random() < 0.6) return `Já ouviu falar? Eu ${d.t}. É por isso que me chamam de ${h.epi}.`;
    const war = Diplo.warsOf(h.civ).length;
    return war ? `Enquanto ${this.civName(h.civ)} estiver em guerra, minha espada não descansa.` : `${h.wins} vitórias e ainda de pé. Se precisar de um braço forte, ${this.civName(h.civ)} sabe onde me achar.`;
  },
};

// ---------------------------------------------------------------- ganchos
{
  const dep0 = War.deploy.bind(War);
  War.deploy = function (ci, a, x0, cy, dir) { dep0.apply(War, arguments); Heroes.toBattle(ci, x0, cy, dir); };
  const fin0 = War.finish.bind(War);
  War.finish = function (win) { const B = G.place; const done = B && B.done; fin0(win); if (B && !done) Heroes.afterBattle(B, win); };
  const kill0 = Game.kill.bind(Game);
  Game.kill = function (e, src) { if (!e.dead) Heroes.onKill(e, src); return kill0(e, src); };
  const die0 = People.die.bind(People);
  People.die = function (p, cause) { if (p && p.alive && p.hero && !p.hero.fell) Heroes.fall(p, cause); return die0(p, cause); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Heroes.monthTick(); };
  // título e fichinhas na conversa
  const tt0 = People.title.bind(People);
  People.title = function (p) { if (p && p.alive && p.hero) return `${Heroes.rankName(p)} de ${Heroes.civName(p.hero.civ)}`; return tt0(p); };
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) {
    const out = ch0(p);
    if (p.hero) out.unshift(`<span class="tag" style="background:#7a5a10">🏅 ${UI.esc(p.hero.epi)} · fama ${p.hero.fame} · ${p.hero.wins} vitórias</span>`);
    else if (p.legend) out.unshift(`<span class="tag" style="background:#4a3a20">📜 Lenda: ${UI.esc(p.legend.epi)}</span>`);
    return out;
  };
  const ln0 = Mind.line.bind(Mind);
  Mind.line = function (p) { return (p.hero || p.legend ? Heroes.line(p) : null) || ln0(p); };
  // lápide com o apelido
  const ga0 = Graves.add.bind(Graves);
  Graves.add = function (p, cause) {
    ga0(p, cause);
    const h = p && (p.hero || p.legend); if (!h) return;
    const g = Graves.list().find(x => x.pid === p.id); if (!g || g.heroEpi) return;
    g.heroEpi = h.epi; g.name = `${g.name}, ${h.epi}`; g.lines.unshift(`Herói de ${Heroes.civName(h.civ)}, com ${h.fame} de fama.`);
  };
}
