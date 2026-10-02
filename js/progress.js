'use strict';
// Estatísticas, conquistas, diário do herói, dinastia e profissões dos filhos.

const ACHIEVEMENTS = [
  { id: 'first_tree', icon: '🪓', name: 'Lenhador',            desc: 'Corte 25 árvores.',                   t: s => s.trees >= 25 },
  { id: 'tree200',    icon: '🌲', name: 'Derrubador de Florestas', desc: 'Corte 200 árvores.',              t: s => s.trees >= 200 },
  { id: 'ore50',      icon: '⛏️', name: 'Mineiro',             desc: 'Quebre 50 rochas e veios.',          t: s => s.ores >= 50 },
  { id: 'gem',        icon: '💎', name: 'Caçador de Gemas',    desc: 'Encontre uma Gema Bruta.',           t: () => Inv.count('gem') > 0 || (G.stats.gems || 0) > 0 },
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
    for (const a of ACHIEVEMENTS) {
      if (G.ach[a.id]) continue;
      let ok = false;
      try { ok = a.t(s); } catch (e) { ok = false; }
      if (!ok) continue;
      G.ach[a.id] = G.day;
      UI.banner(`${a.icon} Conquista: ${a.name}`);
      UI.msg(`🏆 Conquista desbloqueada: ${a.name} — ${a.desc}`, 'gold');
      Sound.play('levelup');
      this.diary(`🏆 Conquista: ${a.name}.`);
    }
  },
  // o herói atual entra para a história da dinastia
  endHero(cause) {
    G.dynasty = G.dynasty || [];
    G.dynasty.push({ name: G.name, sex: P.sex, age: P.age, day: G.day, level: P.level, cause, kingdoms: G.civs.filter(c => c.ruler === 'player').map(c => CIV_DEFS[c.id].short) });
  },
  // efeitos diários das profissões dos filhos
  dayTick() {
    const cd = Calendar.of(G.day);
    if (cd.month === 2 && cd.day === 1 && G.day > 1) this.add('winters'); // chegou a primavera: sobreviveu ao inverno
    for (const p of G.people) {
      if (!p.alive || p.kin !== 'child' || !p.prof) continue;
      if (p.prof === 'smith' && World.structs.some(s => s.owner === 'player' && s.type === 'forge')) { Inv.add('iron_bar', 1); UI.msg(`⚒️ ${p.name} forjou 1 Barra de Ferro.`); }
      if (p.prof === 'farmer') {
        let n = 0;
        for (const k in Farm.plots()) { const pl = G.plots[k]; if (pl.crop) { pl.watered = true; n++; if (pl.stage >= CROPS[pl.crop].days) Farm.harvest(+k); } }
        if (n) UI.msg(`🌾 ${p.name} cuidou de ${n} plantações.`);
      }
      if (p.prof === 'merchant') {
        const box = Store.box(World.startCabin); let g = 0;
        for (const k of Object.keys(box)) { const n = Math.ceil(box[k] * 0.1); box[k] -= n; g += n * ITEMS[k].price; if (box[k] <= 0) delete box[k]; }
        if (g) { P.gold += g; UI.msg(`⚖️ ${p.name} vendeu sobras do baú por ${g} 🪙.`); }
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
