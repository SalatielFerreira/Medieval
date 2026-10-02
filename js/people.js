'use strict';
// Pessoas do mundo: identidade, famílias, personalidade, relacionamentos, conversa, lojas e envelhecimento.


const NAMES_M = ['Afonso', 'Bernardo', 'Duarte', 'Fernão', 'Gonçalo', 'Henrique', 'Jaime', 'Lourenço', 'Martim', 'Nuno', 'Pedro', 'Rodrigo',
  'Sancho', 'Tomé', 'Vasco', 'Álvaro', 'Diogo', 'Estêvão', 'Garcia', 'Mendo', 'Rui', 'Simão', 'Tristão', 'Vicente', 'Gil', 'Egas',
  'Fradique', 'Aires', 'Bartolomeu', 'Leonel', 'Godofredo', 'Ulrico', 'Baltasar', 'Gaspar', 'Lopo', 'Mateus'];
const NAMES_F = ['Aldonça', 'Beatriz', 'Brites', 'Catarina', 'Constança', 'Elvira', 'Filipa', 'Guiomar', 'Inês', 'Isabel', 'Joana', 'Leonor',
  'Mafalda', 'Margarida', 'Marta', 'Mécia', 'Sancha', 'Teresa', 'Urraca', 'Violante', 'Branca', 'Clara', 'Maria', 'Oriana', 'Dulce',
  'Genoveva', 'Isolda', 'Matilde', 'Berengária', 'Helena', 'Lúcia', 'Odete', 'Raquel', 'Briolanja', 'Ermesinda', 'Gertrudes'];
const SURNAMES = ['Ferreira', 'Monteiro', 'Pereira', 'Carvalho', 'Moura', 'Lobo', 'Falcão', 'Coutinho', 'Pacheco', 'Barreto', 'Sousa',
  'Almeida', 'Valente', 'Bravo', 'Rocha', 'Pinto', 'Teles', 'Cunha', 'Fonseca', 'Vilar', 'Castro', 'Meneses', 'Serrano', 'Pimentel',
  'Azevedo', 'Lago', 'Ribeiro', 'Corvo', 'Penedo', 'Montes', 'Abreu', 'Aguiar', 'Amaral', 'Antunes', 'Araújo', 'Arruda', 'Bandeira',
  'Barbosa', 'Beltrão', 'Borges', 'Botelho', 'Brandão', 'Cabral', 'Caldeira', 'Calado', 'Camelo', 'Campos', 'Cardoso', 'Carneiro',
  'Cerqueira', 'Correia', 'Costa', 'Dantas', 'Delgado', 'Dias', 'Esteves', 'Faria', 'Feijó', 'Figueira', 'Freire', 'Furtado', 'Galvão',
  'Gama', 'Garrido', 'Godinho', 'Gouveia', 'Guedes', 'Leitão', 'Leme', 'Lima', 'Lacerda', 'Macedo', 'Machado', 'Magalhães', 'Maia',
  'Malheiro', 'Marinho', 'Matos', 'Medeiros', 'Mesquita', 'Miranda', 'Morais', 'Mota', 'Nóbrega', 'Noronha', 'Novais', 'Oliveira',
  'Paiva', 'Pedrosa', 'Peixoto', 'Pestana', 'Prado', 'Quaresma', 'Queirós', 'Rebelo', 'Reis', 'Resende', 'Sampaio', 'Sarmento',
  'Seixas', 'Siqueira', 'Soares', 'Tavares', 'Torres', 'Vaz', 'Veloso', 'Viana', 'Vieira', 'Xavier', 'Bulhão', 'Cordeiro', 'Espinosa',
  'Fagundes', 'Lusarte', 'Mascarenhas', 'Ormonde', 'Portela', 'Sardinha', 'Toscano', 'Valadares', 'Zarco'];
const HAIR_COLORS = { castanho: '#5a3a1a', preto: '#1e1a18', loiro: '#d9b25a', ruivo: '#b0482a' };

const RANKS = {
  ruler:     { m: 'Rei', f: 'Rainha', noble: true, order: 1 },
  consort:   { m: 'Rei Consorte', f: 'Rainha Consorte', noble: true, order: 2 },
  heir:      { m: 'Príncipe', f: 'Princesa', noble: true, order: 3 },
  knight:    { m: 'Cavaleiro', f: 'Dama Cavaleira', fighter: true, order: 4 },
  merchant:  { m: 'Comerciante', f: 'Comerciante', shop: 'store', order: 5 },
  smith:     { m: 'Ferreiro', f: 'Ferreira', shop: 'smith', order: 5 },
  lumber:    { m: 'Madeireiro', f: 'Madeireira', shop: 'lumber', order: 5 },
  mason:     { m: 'Pedreiro', f: 'Pedreira', shop: 'quarry', order: 5 },
  innkeeper: { m: 'Taverneiro', f: 'Taverneira', shop: 'tavern', order: 5 },
  hunter:    { m: 'Caçador', f: 'Caçadora', shop: 'hunter', order: 6 },
  mercenary: { m: 'Mercenário', f: 'Mercenária', fighter: true, order: 6 },
  peasant:   { m: 'Camponês', f: 'Camponesa', order: 7 },
  priest:    { m: 'Padre', f: 'Madre', order: 6 },
  wanderer:  { m: 'Andarilho', f: 'Andarilha', order: 8 },
  beggar:    { m: 'Mendigo', f: 'Mendiga', order: 9 },
  child:     { m: 'Criança', f: 'Criança', order: 10 },
};
// cor da roupa de cada ofício
const RANK_LOOK = {
  ruler: '#7a1f2a', consort: '#6a2a6a', heir: '#2a4a8a', knight: '#8d949c', merchant: '#6d7f4a', smith: '#4a3a30',
  lumber: '#6a4a26', mason: '#7a7468', innkeeper: '#8a5a3a', hunter: '#4a5a2a', mercenary: '#5a4a3a', peasant: '#8a6d4a',
  wanderer: '#5a6a7a', beggar: '#6b5a45', child: '#a07a50', priest: '#2a2a34',
};

const TRAITS = {
  gentil:      { name: 'Gentil',      talk: 1.3, romance: 1.0, line: 'Posso ajudar em alguma coisa?' },
  alegre:      { name: 'Alegre',      talk: 1.4, romance: 1.1, line: 'Que dia lindo, não acha?' },
  rabugento:   { name: 'Rabugento',   talk: 0.5, romance: 0.6, line: 'Hmpf. As costas doem de novo.' },
  timido:      { name: 'Tímido',      talk: 0.8, romance: 1.3, line: '...oi. Desculpe, não sou de falar muito.' },
  orgulhoso:   { name: 'Orgulhoso',   talk: 0.8, romance: 0.8, fights: true, line: 'Minha família é a mais respeitada destas terras.' },
  ganancioso:  { name: 'Ganancioso',  talk: 0.9, romance: 0.9, gold: 2.5, line: 'Tem moedas sobrando por aí?' },
  romantico:   { name: 'Romântico',   talk: 1.1, romance: 1.7, line: 'A vida é curta demais para não amar.' },
  leal:        { name: 'Leal',        talk: 1.0, romance: 1.0, line: 'Palavra dada é palavra cumprida.' },
  corajoso:    { name: 'Corajoso',    talk: 1.0, romance: 1.0, fights: true, line: 'Se houver luta, pode contar comigo!' },
  desconfiado: { name: 'Desconfiado', talk: 0.6, romance: 0.8, line: 'Por que tantas perguntas?' },
};
// posturas dos capangas: dano causado, dano recebido, raio para atacar (blocos) e até onde perseguem
const STANCES = {
  aggressive: { name: 'Agressivo',   icon: '🔥', dmg: 1.2,  taken: 1.15, aggro: 5,  chase: 16, desc: 'ataca de longe e persegue, causa +20% de dano, mas recebe +15%' },
  normal:     { name: 'Equilibrado', icon: '⚖️', dmg: 1,    taken: 1,    aggro: 0,  chase: 11, desc: 'o jeito de sempre' },
  defensive:  { name: 'Defensivo',   icon: '🛡️', dmg: 0.85, taken: 0.7,  aggro: -4, chase: 6,  desc: 'fica perto, só luta com quem chega, recebe −30% de dano' },
};
const GIFTABLE = ['apple', 'berries', 'bread', 'apple_pie', 'cooked_meat', 'cooked_fish', 'herb', 'cloth', 'leather', 'iron_bar', 'gem',
  'goldfish', 'silver_ring', 'wolf_pelt', 'coconut', 'herbal_salve'];

const SHOPS = {
  store:  { name: 'Armazém',     icon: '🧺', rank: 'merchant',
    sells: ['wheat', 'bread', 'berries', 'apple', 'coconut', 'egg', 'milk', 'fiber', 'rope', 'cloth', 'herb', 'herbal_salve', 'cooked_meat', 'cooked_fish', 'beer', 'fishing_rod', 'hoe',
      'wheat_seed', 'carrot_seed', 'cabbage_seed', 'barley_seed', 'linen_hood', 'linen_tunic', 'linen_pants'],
    buys: it => ['Comida', 'Diversos', 'Sementes'].includes(it.cat) || ['fiber', 'herb', 'rope', 'cloth', 'wheat', 'barley', 'wool', 'honey'].includes(it.key) || (it.cat === 'Armaduras' && it.key.startsWith('linen')) },
  lumber: { name: 'Madeireira',  icon: '🪵', rank: 'lumber',
    sells: ['wood', 'hardwood', 'resin'], buys: it => ['wood', 'hardwood', 'resin'].includes(it.key) },
  quarry: { name: 'Pedreira',    icon: '🪨', rank: 'mason',
    sells: ['stone', 'clay', 'coal', 'brick', 'copper_ore', 'tin_ore', 'iron_ore'],
    buys: it => ['stone', 'clay', 'coal', 'brick', 'copper_ore', 'tin_ore', 'iron_ore', 'silver_ore', 'gold_ore', 'gem'].includes(it.key) },
  smith:  { name: 'Ferreiro',    icon: '⚒️', rank: 'smith',
    sells: ['bronze_bar', 'iron_bar', 'steel_bar', 'stone_axe', 'stone_pick', 'bronze_axe', 'bronze_pick', 'iron_axe', 'iron_pick', 'bronze_sword', 'iron_sword', 'battle_axe',
      'bronze_helm', 'bronze_cuirass', 'bronze_greaves', 'bronze_boots', 'iron_helm', 'chainmail', 'iron_greaves', 'iron_boots', 'silver_ring'],
    buys: it => it.cat === 'Armas' || it.cat === 'Ferramentas' || (it.cat === 'Armaduras' && !it.key.startsWith('linen')) || it.key.endsWith('_bar') || ['silver_ore', 'gold_ore', 'gem', 'silver_ring'].includes(it.key) },
  hunter: { name: 'Caçador',     icon: '🏹', rank: 'hunter',
    sells: ['leather', 'meat', 'bone', 'wolf_pelt', 'deer_antler', 'boar_tusk'],
    buys: it => ['leather', 'meat', 'bone', 'wolf_pelt', 'deer_antler', 'boar_tusk', 'cooked_meat'].includes(it.key) },
};
for (const k in ITEMS) ITEMS[k].key = k;

const People = {
  // ------------------------------------------------------------ criação
  create(o) {
    const sex = o.sex || (Math.random() < 0.5 ? 'm' : 'f');
    // toda pessoa pertence a uma família (casa); sem família indicada, nasce uma nova com sobrenome próprio
    const fam = o.fam !== undefined && Families.get(o.fam) ? Families.get(o.fam) : Families.forNew(o);
    const p = {
      id: G.people.length, sex, name: o.name || U.pick(sex === 'm' ? NAMES_M : NAMES_F), surname: o.surname || fam.surname, fam: fam.id, maiden: o.maiden || null,
      age: o.age !== undefined ? o.age : U.rint(18, 55), rank: o.rank || 'peasant', civ: o.civ !== undefined ? o.civ : -1,
      home: o.home || { type: 'wild' }, trait: o.trait || U.pick(Object.keys(TRAITS)), fav: U.pick(GIFTABLE),
      hair: o.hair || U.pick(Object.values(HAIR_COLORS)), skin: U.pick(['#f0c896', '#e3b07e', '#c98e5e', '#a86e44', '#f5d3ae']),
      aff: o.aff || 0, rom: 0, spouse: null, parents: o.parents || [], children: [], alive: true,
      dating: false, engaged: false, capanga: false, hostile: false, kin: o.kin || null,
      talkDay: -1, complDay: -1, flirtDay: -1, gifts: 0, giftDay: -1, met: false,
      equip: { weapon: null, head: null, torso: null, legs: null, feet: null },
      hairStyle: o.hairStyle || U.pick(sex === 'm' ? ['short', 'short', 'bald', 'curly', 'long', 'mohawk', 'ponytail'] : ['long', 'long', 'braids', 'bun', 'ponytail', 'curly', 'short']),
      beardStyle: o.beardStyle || (sex === 'm' ? U.pick(['none', 'short', 'full', 'mustache', 'goatee', 'long']) : 'none'),
    };
    G.people.push(p);
    return p;
  },
  // casamento: a esposa assume o sobrenome e a casa do marido
  marry(a, b) { a.spouse = b.id; b.spouse = a.id; Families.wed(a, b); },
  child(a, b, o) {
    const c = this.create(Object.assign({
      age: 0, rank: 'child', civ: a.civ, home: a.home, surname: a.surname, fam: a.fam,
      hair: Math.random() < 0.5 ? a.hair : b.hair, parents: [a.id, b.id],
    }, o || {}));
    if (!o || o.age === undefined || o.age === 0) { const ci = Families.civOf(c); G.births = G.births || {}; G.births[ci] = (G.births[ci] || 0) + 1; }
    a.children.push(c.id); b.children.push(c.id);
    if (c.age < 14 && c.rank !== 'heir') c.rank = 'child';
    return c;
  },

  generate() {
    G.people = []; G.fams = {}; G.famSeq = 0;
    // cortes reais
    for (let ci = 0; ci < CIV_DEFS.length; ci++) {
      const d = CIV_DEFS[ci], home = { type: 'castle', civ: ci };
      const ruler = this.create({ name: d.rname, sex: d.rsex, age: U.rint(42, 60), rank: 'ruler', civ: ci, home, trait: U.pick(['orgulhoso', 'leal', 'corajoso', 'desconfiado', 'gentil']) });
      Families.of(ruler).noble = true; Families.of(ruler).seat = 'castle'; Families.of(ruler).civ = ci; Families.of(ruler).wealth = U.rint(400, 700);
      const consort = this.create({ sex: d.rsex === 'm' ? 'f' : 'm', age: ruler.age + U.rint(-6, 3), rank: 'consort', civ: ci, home, fam: ruler.fam, maiden: U.pick(SURNAMES) });
      this.marry(ruler, consort);
      for (let k = U.rint(1, 3); k > 0; k--) {
        const c = this.child(ruler, consort, { rank: 'heir', age: U.rint(6, 24) });
        c.rank = 'heir';
      }
      for (let k = 0; k < 2; k++) this.create({ age: U.rint(22, 45), rank: 'knight', civ: ci, home: { type: 'castle', civ: ci } });
      G.civs[ci].rulerId = ruler.id;
      G.civs[ci].rulerName = this.title(ruler) + ' ' + ruler.name;
    }
    // vilas
    World.villages.forEach((v, vi) => {
      const home = { type: 'village', idx: vi };
      const family = rank => {
        const a = this.create({ age: U.rint(24, 56), rank, civ: v.civ, home });
        if (Math.random() < 0.6) {
          const b = this.create({ sex: a.sex === 'm' ? 'f' : 'm', age: U.clamp(a.age + U.rint(-6, 6), 18, 70), rank: 'peasant', civ: v.civ, home, fam: a.fam, maiden: a.sex === 'm' ? U.pick(SURNAMES) : null });
          if (a.sex === 'f') a.maiden = U.pick(SURNAMES);
          this.marry(a, b);
          for (let k = U.rint(0, 2); k > 0; k--) {
            const c = this.child(a, b, { age: U.rint(1, Math.min(18, a.age - 18)) });
            if (c.age >= 14) c.rank = 'peasant';
          }
        }
        return a;
      };
      for (const r of ['merchant', 'smith', 'lumber', 'mason', 'innkeeper', 'hunter']) family(r);
      this.create({ rank: 'priest', age: U.rint(30, 65), civ: v.civ, home, trait: U.pick(['gentil', 'leal', 'timido', 'desconfiado']) });
      for (let k = U.rint(1, 2); k > 0; k--) family('peasant');
      if (Math.random() < 0.45) this.create({ rank: 'wanderer', age: U.rint(18, 60), civ: v.civ, home });
      if (Math.random() < 0.35) this.create({ rank: 'beggar', age: U.rint(30, 75), civ: v.civ, home, trait: U.pick(['rabugento', 'gentil', 'ganancioso', 'timido']) });
    });
  },

  // ------------------------------------------------------------ consultas
  get(id) { return G.people[id]; },
  full(p) { return `${p.name} ${p.surname}`; },
  title(p) {
    if (p.prof && p.kin === 'child' && PROFESSIONS[p.prof]) return p.sex === 'f' ? PROFESSIONS[p.prof].f : PROFESSIONS[p.prof].name;
    if (p.rank === 'ruler' && p.civ >= 0) return CIV_DEFS[p.civ].title[p.sex === 'm' ? 0 : 1];
    if (p.rank === 'child' && p.age >= 14) return RANKS.peasant[p.sex];
    return RANKS[p.rank][p.sex];
  },
  homeName(p) {
    if (p.home.type === 'village') { const v = World.villages[p.home.idx]; return `${v.name} (${CIV_DEFS[v.civ].short})`; }
    if (p.home.type === 'castle') return 'Castelo de ' + CIV_DEFS[p.home.civ].short;
    if (p.home.type === 'player') return 'Sua casa';
    return 'Sem morada';
  },
  isAdult(p) { return p.age >= 16; },
  hairAt(base, age) {
    // o cabelo embranquece dos 32 aos 72 anos
    const g = U.clamp((age - 32) / 40, 0, 1);
    const a = U.hexRgb(base), b = [226, 226, 222];
    const m = a.map((v, i) => Math.round(v + (b[i] - v) * g));
    return '#' + m.map(v => v.toString(16).padStart(2, '0')).join('');
  },
  look(p) {
    const e = p.equip, it = k => (e[k] ? ITEMS[e[k]] : null);
    const child = p.age < 14;
    const torso = it('torso'), head = it('head');
    const royal = p.rank === 'ruler' || p.rank === 'consort';
    return {
      scale: child ? 0.55 + p.age * 0.03 : 1,
      body: torso ? torso.color : (p.sex === 'f' && p.rank === 'peasant' ? '#9a5a6a' : RANK_LOOK[p.rank] || '#8a6d4a'),
      armor: torso && torso.def >= 3 ? torso.color : (p.rank === 'knight' ? '#8d949c' : null),
      legs: it('legs') ? it('legs').color : '#4a3a2a', boots: it('feet') ? it('feet').color : null,
      helmet: head && head.def >= 2 ? head.color : (p.rank === 'knight' ? '#9aa0a8' : null),
      cap: head && head.def < 2 ? head.color : (p.rank === 'hunter' ? '#3a4a20' : null),
      hood: p.rank === 'beggar' ? '#5a4a38' : null,
      hair: this.hairAt(p.hair, p.age), skin: p.skin, hairStyle: p.hairStyle || (p.sex === 'f' ? 'long' : 'short'),
      beardStyle: p.sex === 'm' && p.age >= 18 ? (p.beardStyle || (p.id % 3 ? 'short' : 'none')) : 'none', skirt: p.sex === 'f',
      crown: royal, cape: royal ? '#7a1f2a' : (p.rank === 'heir' ? '#2a4a8a' : null),
      weapon: it('weapon') ? it('weapon').color : (RANKS[p.rank].fighter || p.capanga ? '#cfd6dd' : null), wlen: it('weapon') ? it('weapon').len : 18,
      shield: p.rank === 'knight' && p.civ >= 0 ? CIV_DEFS[p.civ].color : null,
    };
  },
  // rótulo do relacionamento com o jogador
  relation(p) {
    if (p.kin === 'child') return { text: p.sex === 'm' ? 'Seu filho' : 'Sua filha', col: '#ffd54a' };
    if (p.kin === 'parent') return { text: p.sex === 'm' ? 'Seu pai' : 'Sua mãe', col: '#ffd54a' };
    if (p.kin === 'sibling') return { text: p.sex === 'm' ? 'Seu irmão' : 'Sua irmã', col: '#ffd54a' };
    if (p.spouse === 'player') return { text: p.sex === 'm' ? 'Seu marido' : 'Sua esposa', col: '#ff7ab0' };
    if (p.engaged) return { text: p.sex === 'm' ? 'Seu noivo' : 'Sua noiva', col: '#ff7ab0' };
    if (p.dating) return { text: p.sex === 'm' ? 'Seu namorado' : 'Sua namorada', col: '#ff7ab0' };
    if (p.capanga) return { text: 'Seu capanga', col: '#e0a526' };
    const a = p.aff, f = p.sex === 'f';
    if (a >= 80) return { text: f ? 'Melhor amiga' : 'Melhor amigo', col: '#5fd35f' };
    if (a >= 40) return { text: f ? 'Amiga' : 'Amigo', col: '#5fd35f' };
    if (a >= 10) return { text: f ? 'Conhecida' : 'Conhecido', col: '#c9e0a0' };
    if (a > -30) return { text: f ? 'Estranha' : 'Estranho', col: '#d8c9a6' };
    if (a > -60) return { text: 'Desafeto', col: '#ff9a6b' };
    return { text: f ? 'Inimiga' : 'Inimigo', col: '#ff5d5d' };
  },
  canRomance(p) { return this.isAdult(p) && P.age >= 16 && !p.kin && (p.spouse === null || p.spouse === 'player') && p.rank !== 'child'; },
  residents(vi) { return G.people.filter(p => p.alive && p.home.type === 'village' && p.home.idx === vi && !p.capanga && (p.job === undefined || p.job === null)); },
  shopkeeper(vi, rank) {
    const list = G.people.filter(p => p.alive && p.home.type === 'village' && p.home.idx === vi && p.rank === rank && !p.capanga);
    return list[0] || null;
  },

  // ------------------------------------------------------------ conversa
  say(p) {
    if (p.lost) return 'Por favor, me ajude! Perdi a estrada e não sei voltar para a vila... e dizem que há lobos por aqui.';
    const n = G.name, a = p.aff;
    const pool = [];
    if (p.age < 14) pool.push('Você é um cavaleiro de verdade?', 'Minha mãe disse para não falar com estranhos!', 'Quer brincar de espada?', 'Eu vou ser o maior herói de todos!');
    else if (p.hostile || a <= -50) pool.push('Você tem coragem de aparecer aqui.', 'Some da minha frente, ' + n + '.', 'Não tenho nada para falar com você.');
    else if (a < 0) pool.push('Hum. Pois não?', 'Seja breve, tenho afazeres.', 'Não confio em forasteiros.');
    else if (p.spouse === 'player' || p.rom >= 60) pool.push(`Estava pensando em você, ${n}...`, 'Meu coração dispara quando você chega.', 'Fique um pouco mais comigo.');
    else if (a >= 70) pool.push(`${n}! Que alegria te ver, meu amigo!`, 'Eu confiaria minha vida a você.', 'Sempre que precisar, estarei aqui.');
    else if (a >= 30) pool.push(`Que bom te ver, ${n}!`, 'Sente-se, conte as novidades!', 'Você é sempre bem-vindo por aqui.');
    else pool.push('Bom dia, viajante.', 'Que os deuses guiem seus passos.', 'Dizem que os lobos andam ousados por estas bandas.', 'O inverno vem aí, melhor estocar lenha.');
    const rankLines = {
      ruler: 'O trono escuta. Fale com respeito.', heir: 'Um dia este reino será meu.', knight: 'Juramos proteger o reino até o último fôlego.',
      beggar: 'Uma moedinha para um pobre coitado?', hunter: 'Os cervos estão gordos nesta estação. Quer peles?', smith: 'Meu martelo nunca descansa.',
      lumber: 'Madeira boa é madeira seca.', mason: 'Pedra não mente: ou aguenta ou racha.', innkeeper: 'Cerveja fresca e camas quentes!',
      merchant: 'Tenho de tudo um pouco, é só pedir.', wanderer: 'Já andei por todos os sete reinos.', mercenary: 'Pague bem e eu luto bem.',
    };
    let line = U.pick(pool);
    if (p.age >= 14 && !p.hostile && a > -50 && Math.random() < 0.5) line += ' ' + (Math.random() < 0.5 && rankLines[p.rank] ? rankLines[p.rank] : TRAITS[p.trait].line);
    return line;
  },
  addAff(p, n) {
    const before = this.relation(p).text;
    p.aff = U.clamp(p.aff + n, -100, 100);
    if (p.aff <= -60 && TRAITS[p.trait].fights && p.age >= 16 && !p.kin && p.spouse !== 'player') p.hostile = true;
    if (p.aff > -30) p.hostile = false;
    const after = this.relation(p).text;
    if (before !== after) UI.msg(`${this.full(p)} agora é: ${after}.`, n > 0 ? 'gold' : 'bad');
  },
  talk(p) {
    p.met = true;
    if (p.talkDay === G.day) return { text: this.say(p), note: 'Vocês já conversaram hoje.' };
    p.talkDay = G.day;
    if (p.aff <= -50 && !p.kin) { this.addAff(p, 1); return { text: this.say(p), note: 'Não quis papo.' }; }
    const gain = Math.round(U.rint(3, 7) * TRAITS[p.trait].talk);
    this.addAff(p, gain);
    if (p.dating || p.spouse === 'player') p.rom = Math.min(100, p.rom + 2);
    return { text: this.say(p), note: `Amizade +${gain}` };
  },
  compliment(p) {
    if (p.complDay === G.day) return { text: 'Você já me elogiou hoje... está querendo algo?', note: '' };
    p.complDay = G.day;
    const ok = Math.random() < 0.55 + p.aff / 250 + (p.trait === 'orgulhoso' ? 0.2 : 0) - (p.trait === 'desconfiado' ? 0.25 : 0);
    if (!ok) { this.addAff(p, -4); return { text: U.pick(['Isso foi estranho.', 'Elogio barato, hein?', 'Hum... obrigado, eu acho.']), note: 'Amizade −4' }; }
    this.addAff(p, 6);
    let note = 'Amizade +6';
    if (this.canRomance(p) && p.aff >= 20) { const r = Math.round(4 * TRAITS[p.trait].romance); p.rom = Math.min(100, p.rom + r); note += ` · Romance +${r}`; }
    return { text: U.pick(['Que gentileza sua!', 'Você sabe agradar uma pessoa.', 'Ora, fico até sem graça.']), note };
  },
  gift(p, k) {
    if (Inv.count(k) <= 0) return null;
    Inv.add(k, -1);
    if (p.giftDay !== G.day) { p.giftDay = G.day; p.gifts = 0; }
    p.gifts++;
    const it = ITEMS[k];
    let gain = Math.min(30, 3 + it.price / 3);
    if (k === p.fav) gain *= 2.5;
    gain = Math.round(gain / p.gifts);
    this.addAff(p, gain);
    let note = `Amizade +${gain}`;
    if (this.canRomance(p) && p.aff >= 25) { const r = Math.round(gain * 0.6 * TRAITS[p.trait].romance); p.rom = Math.min(100, p.rom + r); note += ` · Romance +${r}`; }
    const text = k === p.fav ? `${it.name}! É o meu favorito! Como você sabia?` : gain > 8 ? `Que presente maravilhoso! Obrigado!` : 'Obrigado pela lembrança.';
    return { text, note };
  },
  giveGold(p, n) {
    if (P.gold < n) return null;
    P.gold -= n;
    const gain = Math.round(Math.min(25, n / 5) * (TRAITS[p.trait].gold || 1) * (p.rank === 'beggar' ? 1.8 : 1));
    this.addAff(p, gain);
    return { text: p.rank === 'beggar' ? 'Que os deuses te abençoem, bondoso viajante!' : p.trait === 'ganancioso' ? 'Ah, o doce som das moedas!' : 'Moedas? Bem... obrigado.', note: `Amizade +${gain}` };
  },
  flirt(p) {
    if (!this.canRomance(p)) return { text: 'Isso não é apropriado!', note: '' };
    if (p.flirtDay === G.day) return { text: 'Calma... uma coisa de cada vez.', note: '' };
    p.flirtDay = G.day;
    if (p.aff < 30) { this.addAff(p, -6); return { text: U.pick(['Nem nos conhecemos direito!', 'Que atrevimento!']), note: 'Amizade −6 (precisa de amizade 30+)' }; }
    const chance = 0.45 + p.rom / 200 + (p.trait === 'romantico' ? 0.2 : 0) - (p.trait === 'rabugento' ? 0.2 : 0);
    if (Math.random() > chance) { this.addAff(p, -2); return { text: U.pick(['Hoje não...', 'Você é engraçado, sabia?']), note: 'Não funcionou desta vez.' }; }
    const r = Math.round(U.rint(6, 10) * TRAITS[p.trait].romance);
    p.rom = Math.min(100, p.rom + r);
    return { text: U.pick(['*sorri e desvia o olhar*', 'Você está me deixando corado...', 'Talvez... talvez eu goste disso.']), note: `Romance +${r}` };
  },
  insult(p) {
    this.addAff(p, -15);
    if (p.hostile) return { text: U.pick(['Agora você vai ver!', 'Chega! Vou te ensinar respeito!']), note: `${p.name} está furioso e vai atacar!`, fight: true };
    return { text: U.pick(['Como ousa?!', 'Que grosseria!', 'Vou me lembrar disso.']), note: 'Amizade −15' };
  },
  date(p) {
    if (p.aff < 50 || p.rom < 50) return { text: 'Ainda não estou pronto para isso.', note: 'Precisa de amizade 50+ e romance 50+.' };
    if (G.people.some(o => o.alive && (o.dating || o.engaged || o.spouse === 'player') && o !== p)) return { text: 'Ouvi dizer que você já tem alguém...', note: 'Você já tem um relacionamento.' };
    p.dating = true;
    UI.banner('💕 Namorando ' + p.name + '!');
    return { text: 'Sim! Eu aceito namorar você!', note: `Agora você namora ${this.full(p)}.` };
  },
  propose(p) {
    if (!p.dating) return null;
    if (p.rom < 85) return { text: 'Eu gosto de você, mas casamento é um passo grande...', note: 'Precisa de romance 85+.' };
    if (Inv.count('silver_ring') <= 0) return { text: 'Um pedido sem anel?', note: 'Você precisa de um Anel de Prata (forja: 1 Lingote de Prata).' };
    Inv.add('silver_ring', -1);
    p.dating = false; p.engaged = false; p.spouse = 'player'; p.home = { type: 'player' }; p.kin = null;
    if (p.rank === 'beggar' || p.rank === 'wanderer') p.rank = 'peasant';
    G.family.spouse = p.id;
    // quem casa com o herói passa a fazer parte da casa dele (e leva o sobrenome)
    if (p.surname !== G.surname) { p.maiden = p.maiden || p.surname; p.surname = G.surname; }
    p.fam = G.playerFam;
    Progress.add('marriages'); Progress.diary(`💍 Casou-se com ${this.full(p)}.`);
    UI.banner(`💍 Você se casou com ${p.name}!`);
    return { text: 'SIM! Mil vezes sim! Vou morar com você.', note: `${this.full(p)} agora vive na sua casa.` };
  },
  breakUp(p) {
    p.dating = false; p.engaged = false; p.rom = Math.max(0, p.rom - 40);
    if (p.spouse === 'player') { p.spouse = null; G.family.spouse = null; p.home = p.oldHome || { type: 'wild' }; }
    this.addAff(p, -30);
    return { text: 'Como você pôde?! Saia da minha vida!', note: 'O relacionamento terminou.' };
  },
  recruitCost(p) { return { beggar: 15, wanderer: 35, peasant: 45, hunter: 70, mercenary: 0 }[p.rank]; },
  canRecruit(p) { return this.isAdult(p) && this.recruitCost(p) !== undefined && !p.capanga && p.spouse !== 'player' && (p.job === undefined || p.job === null); },
  recruit(p) {
    const cost = this.recruitCost(p);
    if (p.aff < 25) return { text: 'Por que eu seguiria você? Mal te conheço.', note: 'Precisa de amizade 25+.' };
    if (Game.allies().length >= Game.followerCap()) return { text: 'Você já tem gente demais te seguindo.', note: 'Limite de seguidores atingido (construa casas e quartéis).' };
    if (P.gold < cost) return { text: `Quero ${cost} moedas para começar.`, note: 'Ouro insuficiente.' };
    P.gold -= cost;
    p.capanga = true; p.oldHome = p.home;
    Game.spawnCapanga(p);
    return { text: TRAITS[p.trait].fights ? 'Finalmente uma aventura! Vamos!' : 'Está certo, vou com você.', note: `${this.full(p)} agora é seu capanga. Equipe-${p.sex === "m" ? "o" : "a"} pela conversa.` };
  },
  dismiss(p) {
    p.capanga = false; p.post = null; p.home = p.oldHome || p.home;
    for (const e of G.ents) if (e.npc === p) e.dead = true;
    G.spawned.delete(p.id);
    return { text: 'Foi uma honra lutar ao seu lado.', note: `${p.name} voltou para casa.` };
  },
  capangaStats(p) {
    const e = p.equip, lvl = p.clvl || 1, st = STANCES[p.stance] || STANCES.normal;
    const dmg = (9 + (e.weapon ? ITEMS[e.weapon].dmg * 0.8 : 0) + (lvl - 1) * 1.5) * st.dmg;
    const def = ['head', 'torso', 'legs', 'feet'].reduce((s, k) => s + (e[k] ? ITEMS[e[k]].def : 0), 0) + Math.floor((lvl - 1) / 2);
    return { dmg: Math.round(dmg), def, lvl, hp: 70 + Math.min(40, p.age) + (lvl - 1) * 8 };
  },
  // experiência dos capangas: sobem de nível lutando
  capXpNext(p) { return 40 + (p.clvl || 1) * 30; },
  capXp(p, n) {
    if (!p || !p.capanga || !p.alive || n <= 0) return;
    p.clvl = p.clvl || 1; p.cxp = (p.cxp || 0) + n;
    while (p.cxp >= this.capXpNext(p)) {
      p.cxp -= this.capXpNext(p); p.clvl++;
      const st = this.capangaStats(p), e = G.spawned.get(p.id);
      if (e && !e.dead) { e.dmg = st.dmg; e.maxHp = st.hp; e.hp = Math.min(st.hp, e.hp + 8); }
      UI.msg(`⭐ ${p.name} subiu para o nível ${p.clvl}! (dano ${st.dmg}, defesa ${st.def}, vida ${st.hp})`, 'gold');
    }
  },
  setStance(p, k) {
    if (!STANCES[k]) return;
    p.stance = k;
    Game.refreshCapanga(p);
  },

  // ------------------------------------------------------------ morte, herança e o passar dos anos
  die(p, cause) {
    if (!p.alive) return;
    p.alive = false; p.capanga = false; p.dating = false; p.engaged = false;
    if (p.job !== undefined && p.job !== null) { const s = World.structs[p.job]; if (s && s.workers) s.workers = s.workers.filter(id => id !== p.id); p.job = null; }
    G.spawned.delete(p.id);
    if (p.spouse !== null && p.spouse !== 'player' && G.people[p.spouse]) G.people[p.spouse].spouse = null;
    if (p.spouse === 'player') G.family.spouse = null;
    const known = p.met || p.kin || p.aff >= 10;
    if (known) UI.msg(`✝ ${this.full(p)} (${this.title(p)}) morreu${cause ? ' — ' + cause : ''}.`, 'bad');
    // família lamenta (e culpa quem matou)
    if (cause === 'morto por você') for (const id of [...p.children, ...(p.spouse !== null && p.spouse !== 'player' ? [p.spouse] : []), ...p.parents]) {
      const r = G.people[id];
      if (r && r.alive && !r.kin) this.addAff(r, -50);
    }
    // ofício passa para um filho adulto
    const shopRanks = ['merchant', 'smith', 'lumber', 'mason', 'innkeeper', 'hunter', 'ruler'];
    if (shopRanks.includes(p.rank)) {
      const heir = p.children.map(id => G.people[id]).filter(c => c && c.alive && c.age >= 14 && !c.capanga && !c.kin && c.spouse !== 'player').sort((a, b) => b.age - a.age)[0];
      if (heir) {
        heir.rank = p.rank; heir.home = p.home;
        if (known || p.rank === 'ruler') UI.msg(`${this.full(heir)} herdou o ofício de ${this.title(heir)}.`, 'gold');
      } else if (p.rank !== 'ruler' && known) UI.msg(`Sem herdeiros, o ofício de ${RANKS[p.rank][p.sex]} de ${this.homeName(p)} ficou vago.`, 'bad');
      if (p.rank === 'ruler' && p.civ >= 0) this.succeed(p.civ, heir, p);
    }
  },
  succeed(ci, heir, old) {
    const c = G.civs[ci];
    if (c.ruler === 'player') return;
    let next = heir;
    if (!next && old.spouse !== null && old.spouse !== 'player') { const s = G.people[old.spouse]; if (s && s.alive) next = s; }
    if (!next) next = G.people.find(q => q.alive && q.rank === 'knight' && q.civ === ci);
    if (!next) next = this.create({ rank: 'ruler', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(30, 50) });
    next.rank = 'ruler'; next.home = { type: 'castle', civ: ci };
    c.rulerId = next.id; c.rulerName = this.title(next) + ' ' + next.name;
    UI.msg(`👑 ${c.rulerName} é o novo soberano de ${CIV_DEFS[ci].name}.`, 'gold');
  },
  // um ano se passa para todos
  tickYear() {
    P.age++;
    for (const p of G.people) {
      if (!p.alive) continue;
      p.age++;
      if (p.rank === 'child' && p.age >= 14) {
        p.rank = 'peasant';
        if (p.kin === 'child') UI.msg(`${p.name} cresceu e já tem ${p.age} anos!`, 'gold');
      }
      // morte natural
      if (p.age > 58 && Math.random() < (p.age - 58) * 0.025) { this.die(p, 'de velhice'); continue; }
      // casais têm filhos
      if (p.spouse !== null && p.spouse !== 'player' && p.sex === 'f' && p.age >= 18 && p.age <= 42 && Math.random() < 0.4 * Families.birthFactor(p)) {
        const s = G.people[p.spouse];
        if (s && s.alive) {
          const c = this.child(p, s, { rank: p.rank === 'ruler' || s.rank === 'ruler' || p.rank === 'consort' ? 'heir' : 'child' });
          if (c.rank === 'heir') c.age = 0;
        }
      }
    }
    G.lastBirths = G.births || {}; G.births = {};
    Families.yearTick();
    UI.msg(`🎂 Mais um ano de vida (cada mês do calendário vale um ano): ${G.name} agora tem ${P.age} anos.`);
    if (P.age >= 62 && Math.random() < (P.age - 60) * 0.04) Game.playerDie('de velhice');
  },
  ageAll(years) { for (let k = 0; k < years; k++) for (const p of G.people) if (p.alive) { p.age++; if (p.rank === 'child' && p.age >= 14) p.rank = 'peasant'; } },
};
