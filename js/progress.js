'use strict';
// Estatísticas, conquistas, diário do herói, dinastia e profissões dos filhos.

const ACHIEVEMENTS = [
  { id: 'first_tree', icon: '🪓', name: 'Lenhador',            desc: 'Corte 25 árvores.',                   t: s => s.trees >= 25 },
  { id: 'tree200',    icon: '🌲', name: 'Derrubador de Florestas', desc: 'Corte 200 árvores.',              t: s => s.trees >= 200 },
  { id: 'ore50',      icon: '⛏️', name: 'Mineiro',             desc: 'Quebre 50 rochas e veios.',          t: s => s.ores >= 50 },
  { id: 'gem',        icon: '💎', name: 'Caçador de Gemas',    desc: 'Encontre uma Gema Bruta.',           t: () => Inv.count('gem') > 0 || (G.stats.gems || 0) > 0 },
  { id: 'digger',     icon: '🪏', name: 'Escavador',           desc: 'Cave 50 buracos com a pá.',          t: s => (s.dug || 0) >= 50 },
  { id: 'landmaker',  icon: '🏝️', name: 'Construtor de Terras', desc: 'Aterre 30 trechos de água com a pá.', t: s => (s.filled || 0) >= 30 },
  { id: 'fish10',     icon: '🎣', name: 'Pescador',            desc: 'Pesque 10 peixes.',                  t: s => s.fish >= 10 },
  { id: 'goldfish',   icon: '🐠', name: 'Sorte Dourada',       desc: 'Pesque um Peixe-Dourado.',           t: s => s.goldfish >= 1 },
  { id: 'craft30',    icon: '🔨', name: 'Artesão',             desc: 'Crie 30 itens.',                     t: s => s.crafted >= 30 },
  { id: 'build10',    icon: '🏗️', name: 'Construtor',          desc: 'Construa 10 construções.',           t: s => s.built >= 10 },
  { id: 'farm',       icon: '🌾', name: 'Lavrador',            desc: 'Colha 50 alimentos plantados.',      t: s => s.harvested >= 50 },
  { id: 'hunter',     icon: '🐺', name: 'Caçador',             desc: 'Abata 25 animais selvagens.',        t: s => (s.kill_deer || 0) + (s.kill_boar || 0) + (s.kill_wolf || 0) >= 25 },
  { id: 'bandits',    icon: '🗡️', name: 'Terror dos Bandidos', desc: 'Derrote 30 bandidos.',               t: s => (s.kill_bandit || 0) >= 30 },
  { id: 'camp',       icon: '🏕️', name: 'Limpa-Estradas',      desc: 'Destrua um acampamento de bandidos.', t: s => s.camps >= 1 },
  { id: 'boss',       icon: '☠️', name: 'Matador de Monstros', desc: 'Derrote um chefe de caverna.',        t: s => s.bosses >= 1 },
  { id: 'dragon',     icon: '🐉', name: 'Matador de Dragões',  desc: 'Derrote o Dragão Ancestral.',         t: s => (s.kill_dragon || 0) >= 1 },
  { id: 'chests',     icon: '💰', name: 'Saqueador de Tumbas', desc: 'Abra 10 baús de tesouro.',            t: s => s.chests >= 10 },
  { id: 'block',      icon: '🛡️', name: 'Muralha Viva',        desc: 'Bloqueie 50 golpes.',                 t: s => s.blocks >= 50 },
  { id: 'battle',     icon: '⚔️', name: 'Veterano de Guerra',  desc: 'Vença 3 batalhas em campo aberto.',   t: s => s.battlesWon >= 3 },
  { id: 'caravan',    icon: '🐫', name: 'Guardião das Estradas', desc: 'Salve 3 caravanas de bandidos.',    t: s => s.caravansSaved >= 3 },
  { id: 'robber',     icon: '🏴', name: 'Fora da Lei',         desc: 'Saqueie uma caravana.',               t: s => s.caravansRobbed >= 1 },
  { id: 'rich',       icon: '🪙', name: 'Bolsa Pesada',        desc: 'Tenha 1000 moedas de uma vez.',       t: () => P.gold >= 1000 },
  { id: 'tycoon',     icon: '🏦', name: 'Magnata',             desc: 'Tenha 10.000 moedas de uma vez.',     t: () => P.gold >= 10000 },
  { id: 'tavern',     icon: '🍺', name: 'Taverneiro',          desc: 'Lucre 500 moedas com sua taverna.',   t: s => s.tavernGold >= 500 },
  { id: 'friend',     icon: '🤝', name: 'Querido pelo Povo',   desc: 'Tenha 10 amigos.',                    t: () => G.people.filter(p => p.alive && p.aff >= 40).length >= 10 },
  { id: 'love',       icon: '💕', name: 'Coração Conquistado', desc: 'Comece um namoro.',                   t: () => G.people.some(p => p.dating || p.spouse === 'player') },
  { id: 'married',    icon: '💍', name: 'Felizes para Sempre', desc: 'Case-se.',                            t: s => s.marriages >= 1 },
  { id: 'child',      icon: '👶', name: 'Pai/Mãe',             desc: 'Tenha um filho.',                     t: s => s.children >= 1 },
  { id: 'dynasty',    icon: '🌳', name: 'Dinastia',            desc: 'Jogue com 3 gerações da família.',    t: () => (G.dynasty || []).length >= 2 },
  { id: 'king',       icon: '👑', name: 'Soberano',            desc: 'Governe um reino.',                   t: () => G.civs.some(c => c.ruler === 'player') },
  { id: 'emperor',    icon: '🏰', name: 'Imperador',           desc: 'Governe 3 reinos ao mesmo tempo.',    t: () => G.civs.filter(c => c.ruler === 'player').length >= 3 },
  { id: 'horse',      icon: '🐴', name: 'Cavaleiro Errante',   desc: 'Compre um cavalo.',                   t: () => !!P.horse },
  { id: 'sailor',     icon: '⛵', name: 'Navegador',           desc: 'Navegue até uma ilha distante.',      t: s => s.islands >= 1 },
  { id: 'level10',    icon: '⭐', name: 'Herói Lendário',      desc: 'Alcance o nível 10.',                 t: () => P.level >= 10 },
  { id: 'survivor',   icon: '❄️', name: 'Sobrevivente',        desc: 'Sobreviva a um inverno inteiro.',     t: s => s.winters >= 1 },
];

const PROFESSIONS = {
  smith:    { name: 'Ferreiro',     f: 'Ferreira',     icon: '⚒️', desc: 'Trabalha na sua forja: produz 1 Barra de Ferro por dia.' },
  farmer:   { name: 'Lavrador',     f: 'Lavradora',    icon: '🌾', desc: 'Rega todas as suas plantações e colhe as maduras todo dia.' },
  merchant: { name: 'Comerciante',  f: 'Comerciante',  icon: '⚖️', desc: 'Vende um pouco das sobras do baú da cabana e traz ouro todo dia.' },
  knight:   { name: 'Cavaleiro',    f: 'Dama Cavaleira', icon: '🛡️', desc: 'Torna-se um capanga forte, com armadura de ferro.' },
  governor: { name: 'Governador',   f: 'Governadora',  icon: '👑', desc: 'Administra um dos seus reinos: +6 de felicidade por dia nele.' },
  scholar:  { name: 'Erudito',      f: 'Erudita',      icon: '📖', desc: 'Estuda muito: se herdar a família, começa com +4 níveis.' },
};

const Progress = {
  S() { return G.stats || (G.stats = {}); },
  add(k, n = 1) { const s = this.S(); s[k] = (s[k] || 0) + n; },
  diary(text) {
    G.diary = G.diary || [];
    G.diary.unshift({ day: G.day, text });
    if (G.diary.length > 120) G.diary.length = 120;
  },
  check() {
    G.ach = G.ach || {};
    const s = this.S();
    Court.checkCivil(s);
    for (const a of ACHIEVEMENTS) {
      if (G.ach[a.id]) continue;
      let ok = false;
      try { ok = a.t(s); } catch (e) { ok = false; }
      if (!ok) continue;
      G.ach[a.id] = G.day;
      UI.banner(`${a.icon} Conquista: ${a.name}`);
      UI.msg(`🏆 Conquista desbloqueada: ${a.name} — ${a.desc}`, 'gold', true);
      Sound.play('levelup');
      this.diary(`🏆 Conquista: ${a.name}.`);
    }
  },
  // o herói atual entra para a história da dinastia
  endHero(cause) {
    Graves.addHero(cause); // o herói é enterrado no cemitério do reino
    G.dynasty = G.dynasty || [];
    G.dynasty.push({ name: G.name, sex: P.sex, age: P.age, day: G.day, level: P.level, cause, kingdoms: G.civs.filter(c => c.ruler === 'player').map(c => CIV_DEFS[c.id].short) });
  },
  // efeitos diários das profissões dos filhos
  dayTick() {
    const cd = Calendar.of(G.day);
    if (cd.month === 2 && cd.day === 1 && G.day > 1) this.add('winters'); // chegou a primavera: sobreviveu ao inverno
  },
  // uma vez por mês: o trabalho dos filhos com profissão
  econTick() {
    for (const p of G.people) {
      if (!p.alive || p.kin !== 'child' || !p.prof) continue;
      if (p.prof === 'smith' && World.structs.some(s => s.owner === 'player' && s.type === 'forge')) { Inv.add('iron_bar', 1); Game.note(`⚒️ ${p.name} forjou 1 Barra de Ferro.`); }
      if (p.prof === 'farmer') {
        let n = 0;
        for (const k in Farm.plots()) { const pl = G.plots[k]; if (pl.crop) { pl.watered = true; n++; if (pl.stage >= CROPS[pl.crop].days) Farm.harvest(+k); } }
        if (n) Game.note(`🌾 ${p.name} cuidou de ${n} plantações.`);
      }
      if (p.prof === 'merchant') {
        const box = Store.box(World.startCabin); let g = 0;
        for (const k of Object.keys(box)) { const n = Math.ceil(box[k] * 0.1); box[k] -= n; g += n * ITEMS[k].price; if (box[k] <= 0) delete box[k]; }
        if (g) { P.gold += g; Game.note(`⚖️ ${p.name} vendeu sobras do baú por ${g} 🪙.`); }
      }
      if (p.prof === 'governor') { const c = G.civs.find(x => x.ruler === 'player'); if (c) c.happy = Math.min(100, c.happy + 6); }
    }
  },
  setProf(p, k) {
    p.prof = k;
    if (k === 'knight') {
      p.rank = 'knight'; p.capanga = true; p.oldHome = p.home;
      Object.assign(p.equip, { weapon: 'iron_sword', torso: 'chainmail', head: 'iron_helm', legs: 'iron_greaves', feet: 'iron_boots' });
      if (Game.allies().length < Game.followerCap()) Game.spawnCapanga(p);
    }
    if (k === 'smith') p.rank = 'smith';
    if (k === 'farmer') p.rank = 'peasant';
    if (k === 'merchant') p.rank = 'merchant';
    UI.msg(`${PROFESSIONS[k].icon} ${p.name} agora é ${p.sex === 'f' ? PROFESSIONS[k].f : PROFESSIONS[k].name}.`, 'gold');
    this.diary(`${PROFESSIONS[k].icon} ${p.name} escolheu ser ${p.sex === 'f' ? PROFESSIONS[k].f : PROFESSIONS[k].name}.`);
  },
};

// ====================================================================== ranking do mundo (Diário → Ranking)
// Atributos das pessoas criados na primeira vez que alguém olha (e guardados com elas): força, inteligência e mortes
// combinam com quem a pessoa é (cavaleiro forte, padre e conselheiro estudados, caçador que já abateu muito...).
const Ranking = {
  STR: { knight: 70, mercenary: 66, smith: 60, mason: 58, lumber: 56, hunter: 55, sailor: 52, peasant: 42, ruler: 50, heir: 48, consort: 38, merchant: 34, innkeeper: 38, priest: 28, wanderer: 40, beggar: 26, child: 12 },
  INT: { priest: 72, ruler: 66, consort: 60, merchant: 60, heir: 56, innkeeper: 48, smith: 46, knight: 44, sailor: 42, mason: 38, lumber: 34, hunter: 36, mercenary: 34, peasant: 32, wanderer: 40, beggar: 26, child: 20 },
  KILLS: { knight: [8, 45], mercenary: [12, 60], hunter: [25, 90], ruler: [2, 20], heir: [0, 10], sailor: [0, 8] },
  // gera os atributos de uma pessoa (uma vez só)
  stats(p) {
    if (p.str === undefined) {
      const h = (n) => U.hash2(p.id, n, 4321);
      const ageF = p.age < 14 ? 0.35 + p.age * 0.04 : p.age > 55 ? Math.max(0.55, 1 - (p.age - 55) * 0.02) : 1;
      p.str = Math.round(U.clamp(((this.STR[p.rank] || 40) + (h(1) - 0.5) * 30) * ageF, 3, 99));
      p.int = Math.round(U.clamp((this.INT[p.rank] || 35) + (h(2) - 0.5) * 34 + (p.comp ? p.comp * 2 : 0) + Math.min(10, p.age / 6), 3, 99));
      const k = this.KILLS[p.rank]; p.kills = (p.kills || 0) + (k ? Math.round(k[0] + h(3) * (k[1] - k[0])) : Math.round(h(3) * 2));
    }
    return p;
  },
  // o nível de uma pessoa: idade, mortes, cargo e (para capangas) o nível de capanga
  level(p) {
    this.stats(p);
    const rankB = { ruler: 8, consort: 4, heir: 3, knight: 6, mercenary: 5, hunter: 3, priest: 2, merchant: 2, smith: 2, sailor: 2 }[p.rank] || 0;
    return Math.max(1, Math.min(40, Math.round(1 + Math.min(p.age, 50) / 10 + p.kills / 8 + rankB + (p.clvl || 0) + (p.council ? 3 : 0))));
  },
  wealth(p) {
    const f = Families.of(p), share = f && !f.player ? f.wealth / Math.max(1, Families.adults(f).length) : 0;
    const crown = p.rank === 'ruler' && p.civ >= 0 && G.civs[p.civ] ? G.civs[p.civ].treasury * 0.25 : 0;
    return Math.round((p.purse || 0) + share + crown);
  },
  // popularidade: o quanto o povo conhece e admira a pessoa (cargo, família, filhos, chefia de vila)
  popularity(p) {
    const rankB = { ruler: 90, consort: 55, heir: 40, knight: 28, priest: 26, merchant: 18, innkeeper: 22, smith: 14, sailor: 12, mercenary: 10, hunter: 10 }[p.rank] || 4;
    const f = Families.of(p);
    return Math.round(rankB + (f && !f.player ? Families.influence(f) / 4 : 0) + (Families.isChief(p) ? 30 : 0) + p.children.length * 3 + (p.council ? 20 : 0) + Math.max(0, p.aff) / 10);
  },
  // o herói nas mesmas escalas
  hero() {
    const kids = G.people.filter(q => q.alive && (q.kin === 'child' || (q.parents || []).includes('player'))).length;
    return { you: true, name: `${G.name} ${G.surname || ''}`.trim(), sub: 'Você',
      wealth: P.gold, popularity: Math.round(Court.fame() + G.civs.filter(c => c.ruler === 'player').length * 90 + Court.titledCivs().length * 25 + kids * 3),
      kills: Court.kills(G.stats || {}), children: kids, str: Math.round(U.clamp(18 + P.level * 3 + Game.pDmg() * 0.8, 1, 99)),
      int: Math.round(U.clamp(22 + P.level * 2.5 + (Faith.piety ? Faith.piety() / 8 : 0) + (G.stats.crafted || 0) / 25, 1, 99)), level: P.level, age: P.age };
  },
  rows() {
    const out = [this.hero()];
    for (const p of G.people) {
      if (!p.alive) continue;
      this.stats(p);
      out.push({ p, name: People.full(p), sub: People.title(p), wealth: this.wealth(p), popularity: this.popularity(p), kills: p.kills, children: p.children.length,
        str: p.str, int: p.int, level: this.level(p), age: p.age, friend: p.aff });
    }
    return out;
  },
  CATS: [
    ['wealth', '💰', 'Mais ricos', v => v.toLocaleString('pt-BR') + ' 🪙'],
    ['popularity', '🌟', 'Mais populares', v => v + ' de prestígio'],
    ['kills', '⚔️', 'Que mais derrotaram inimigos', v => v + (v === 1 ? ' derrota' : ' derrotas')],
    ['children', '👶', 'Que têm mais filhos', v => v + (v === 1 ? ' filho' : ' filhos')],
    ['str', '💪', 'Mais fortes', v => 'força ' + v],
    ['int', '🧠', 'Mais inteligentes', v => 'inteligência ' + v],
    ['level', '⭐', 'Nível mais alto', v => 'nível ' + v],
    ['age', '🧓', 'Mais velhos', v => v + ' anos'],
    ['friend', '🤝', 'Seus maiores amigos', v => 'amizade ' + Math.round(v)],
  ],
  top(rows, key, n = 3) {
    return rows.filter(r => r[key] !== undefined && !(key === 'friend' && (r.you || r.friend <= 0))).sort((a, b) => b[key] - a[key] || (a.you ? -1 : 0)).slice(0, n);
  },
  // posição do herói em cada categoria
  place(rows, key) { const s = rows.filter(r => r[key] !== undefined).sort((a, b) => b[key] - a[key]); return s.findIndex(r => r.you) + 1; },
};
