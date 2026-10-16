'use strict';
// Biomas (terreno versão 12): recursos do pântano, do deserto, da estepe e da tundra, os materiais que eles dão,
// as receitas que usam esses materiais e os três animais novos (crocodilo, alce e camelo).
// Os tipos de terreno ficam em world.js (T.SWAMP, T.DESERT, T.TUNDRA, T.STEPPE) e a geração em World.biomes().

// ---------------------------------------------------------------- recursos no mapa (OBJ 20 a 31)
OBJ[20] = { name: 'Cacto',               tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 3,  drops: { cactus_fruit: [1, 2], fiber: [0, 1] }, pc: '#4a8a3a' };
OBJ[21] = { name: 'Tamareira',           tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 5,  drops: { dates: [2, 4], wood: [1, 2] },        pc: '#6a9a3a' };
OBJ[22] = { name: 'Rocha de Arenito',                blocks: true,  tool: 'pick', min: 0, hp: 7,  drops: { sandstone: [3, 5] },                  pc: '#d8a868' };
OBJ[23] = { name: 'Salina',                          blocks: false, tool: 'pick', min: 0, hp: 3,  drops: { salt: [2, 3] },                       pc: '#f4f0e8' };
OBJ[24] = { name: 'Salgueiro',           tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 5,  drops: { wood: [2, 3], herb: [0, 1] },          pc: '#5a7a3a' };
OBJ[25] = { name: 'Junco',                           blocks: false, tool: null,   min: 0, hp: 1,  drops: { reed: [2, 4] },                       pc: '#8a9a4a' };
OBJ[26] = { name: 'Cogumelos',                       blocks: false, tool: null,   min: 0, hp: 1,  drops: { mushroom: [1, 3] },                   pc: '#c8584a' };
OBJ[27] = { name: 'Turfeira',                        blocks: false, tool: 'pick', min: 0, hp: 3,  drops: { peat: [2, 3] },                       pc: '#4a3626' };
OBJ[28] = { name: 'Líquen',                          blocks: false, tool: null,   min: 0, hp: 1,  drops: { lichen: [1, 2] },                     pc: '#c9c48e' };
OBJ[29] = { name: 'Arbusto Seco',                    blocks: false, tool: null,   min: 0, hp: 1,  drops: { fiber: [1, 2], wood: [0, 1] },        pc: '#9a8a4a' };
OBJ[30] = { name: 'Veio de Âmbar',                   blocks: true,  tool: 'pick', min: 2, hp: 10, drops: { amber: [1, 2], stone: [0, 1] },        pc: '#e8a030' };
OBJ[31] = { name: 'Acácia',              tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 6,  drops: { wood: [2, 4], resin: [0, 1] },         pc: '#6a7a2a' };
for (let k = 20; k <= 31; k++) OBJ[k].regrow = YEAR_DAYS * DAY_LEN;

// ---------------------------------------------------------------- materiais e o que se faz com eles
Object.assign(ITEMS, {
  cactus_fruit: { name: 'Figo-da-Índia',        icon: '🌵', cat: 'Comida',    price: 3,  food: 12, heal: 4 },
  dates:        { name: 'Tâmaras',              icon: '🌴', cat: 'Comida',    price: 4,  food: 14, heal: 4 },
  mushroom:     { name: 'Cogumelo',             icon: '🍄', cat: 'Comida',    price: 2,  food: 8,  heal: 2 },
  mushroom_soup:{ name: 'Sopa de Cogumelos',    icon: '🍲', cat: 'Comida',    price: 14, food: 40, heal: 25 },
  salted_meat:  { name: 'Carne Salgada',        icon: '🥓', cat: 'Comida',    price: 14, food: 38, heal: 15 },
  sandstone:    { name: 'Arenito',              icon: '🧱', cat: 'Recursos',  price: 2 },
  salt:         { name: 'Sal',                  icon: '🧂', cat: 'Recursos',  price: 6 },
  reed:         { name: 'Junco',                icon: '🎋', cat: 'Recursos',  price: 1 },
  peat:         { name: 'Turfa',                icon: '🟤', cat: 'Recursos',  price: 3 },
  lichen:       { name: 'Líquen',               icon: '🌿', cat: 'Recursos',  price: 4 },
  amber:        { name: 'Âmbar',                icon: '🔶', cat: 'Recursos',  price: 45 },
  croc_hide:    { name: 'Couro de Crocodilo',   icon: '🐊', cat: 'Recursos',  price: 40 },
  croc_tooth:   { name: 'Dente de Crocodilo',   icon: '🦷', cat: 'Recursos',  price: 12 },
  moose_antler: { name: 'Galhada de Alce',      icon: '🦌', cat: 'Recursos',  price: 30 },
  camel_hair:   { name: 'Pelo de Camelo',       icon: '🐪', cat: 'Recursos',  price: 10 },
  reed_basket:  { name: 'Cesto de Junco',       icon: '🧺', cat: 'Diversos',  price: 12 },
  amber_amulet: { name: 'Amuleto de Âmbar',     icon: '📿', cat: 'Diversos',  price: 160 },
  croc_armor:   { name: 'Couraça de Crocodilo', icon: '🦺', cat: 'Armaduras', price: 180, slot: 'torso', def: 5, color: '#4a5a2a' },
  camel_cloak:  { name: 'Manto de Pelo de Camelo', icon: '🧥', cat: 'Armaduras', price: 70, slot: 'torso', def: 3, color: '#c8a46a' },
});
RECIPES.push(
  { out: 'salted_meat',   n: 2, cost: { meat: 2, salt: 1 },                 station: 'fogueira' },
  { out: 'mushroom_soup', n: 1, cost: { mushroom: 3, wood: 1 },             station: 'fogueira' },
  { out: 'coal',          n: 1, cost: { peat: 3 },                          station: 'fogueira' },
  { out: 'rope',          n: 1, cost: { reed: 4 },                          station: 'bancada' },
  { out: 'reed_basket',   n: 1, cost: { reed: 6 },                          station: 'bancada' },
  { out: 'stone',         n: 3, cost: { sandstone: 2 },                     station: 'bancada' },
  { out: 'cloth',         n: 1, cost: { camel_hair: 3 },                    station: 'bancada' },
  { out: 'camel_cloak',   n: 1, cost: { camel_hair: 5, leather: 2 },        station: 'bancada' },
  { out: 'croc_armor',    n: 1, cost: { croc_hide: 4, leather: 2, croc_tooth: 2 }, station: 'bancada' },
  { out: 'herbal_salve',  n: 1, cost: { lichen: 2, herb: 1 },               station: 'fogueira' },
  { out: 'amber_amulet',  n: 1, cost: { amber: 3, gold_bar: 1 },            station: 'forja' },
);
// receita que use um item que não existe nesta versão é descartada
for (let k = RECIPES.length - 1; k >= 0; k--) if (!ITEMS[RECIPES[k].out]) RECIPES.splice(k, 1);

// ---------------------------------------------------------------- animais novos
Object.assign(CREATURES, {
  croc:  { name: 'Crocodilo', hp: 95, dmg: 14, speed: 62, r: 13, faction: 'wild', drops: { croc_hide: [1, 1], croc_tooth: [1, 2], meat: [1, 3] }, xp: 30, aggro: 4 },
  moose: { name: 'Alce',      hp: 75, dmg: 10, speed: 78, r: 14, faction: 'prey', drops: { meat: [3, 4], leather: [1, 2], moose_antler: [0, 1], bone: [1, 2] }, xp: 18, aggro: 0 },
  camel: { name: 'Camelo',    hp: 55, dmg: 0,  speed: 80, r: 13, faction: 'prey', drops: { meat: [2, 3], camel_hair: [2, 4], leather: [1, 1] }, xp: 10 },
});
const WILD_ANIMALS = ['deer', 'boar', 'wolf', 'fox', 'rabbit', 'goat', 'bear', 'croc', 'moose', 'camel'];

// ---------------------------------------------------------------- ícones desenhados (mochila)
Object.assign(MAT, { croc: ['#5a6a32', '#2a3418', '#8a9a5a'], camel: ['#c8a46a', '#8a6a3a', '#ead0a0'], moose: ['#7a5a3a', '#4a3020', '#a88a62'], amber: ['#e8a030', '#9a5a10', '#ffd890'] });
Object.assign(ART_ITEMS, { croc_hide: ['hide', 'croc'], camel_hair: ['pelt', 'camel'], moose_antler: ['horn', 'moose'], croc_tooth: ['clawi', 'bone'], amber: ['nugget', 'amber'] });

// ---------------------------------------------------------------- desenho dos recursos novos
World.biomeSprites = function (S, sn) {
  const mk = (fn, w = 24, h = 32) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; };
  const circ = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const el = (g, x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };
  const shadow = (g, w) => el(g, 12, 30, w || 8, 2.5, 'rgba(0,0,0,0.28)');
  const snow = sn === 3;
  // cacto com braços e flores
  S[20] = ['#4a8a3a', '#3f7d34'].map(col => mk(g => {
    shadow(g, 6);
    g.fillStyle = col; g.fillRect(10, 8, 5, 22); g.fillRect(5, 15, 3, 7); g.fillRect(5, 20, 6, 3); g.fillRect(17, 12, 3, 8); g.fillRect(14, 18, 6, 3);
    g.fillStyle = U.shade(col, 0.2); g.fillRect(11, 9, 1, 20); g.fillRect(5, 16, 1, 5); g.fillRect(17, 13, 1, 6);
    g.fillStyle = U.shade(col, -0.25); g.fillRect(14, 9, 1, 21);
    g.fillStyle = '#f2e6b0'; for (const [x, y] of [[12, 12], [13, 18], [11, 24], [6, 17], [18, 14]]) g.fillRect(x, y, 1, 1);
    circ(g, 12.5, 7.5, 1.6, '#e85a8a'); circ(g, 18.5, 11.5, 1.2, '#f0c040');
  }));
  // tamareira (palmeira de tâmaras)
  S[21] = [mk(g => {
    shadow(g);
    for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#8a6a3a' : '#7a5a30'; g.fillRect(11 + Math.round(Math.sin(k * 0.3) * 1.5), 29 - k * 2.4, 3, 3); }
    g.strokeStyle = '#5a8a32'; g.lineWidth = 2.2; g.lineCap = 'round';
    for (const [dx, dy] of [[-10, 4], [10, 5], [-7, -3], [7, -4], [0, -6], [-4, 6], [4, 6]]) { g.beginPath(); g.moveTo(12.5, 8); g.quadraticCurveTo(12.5 + dx * 0.5, 4 + dy * 0.3, 12.5 + dx, 8 + dy); g.stroke(); }
    g.fillStyle = '#9a4a1a'; for (const [x, y] of [[10, 10], [12, 11], [14, 10], [11, 12], [13, 12]]) g.fillRect(x, y, 2, 2);
  })];
  // rocha de arenito (camadas alaranjadas)
  S[22] = [mk(g => {
    shadow(g);
    g.fillStyle = '#b88a52'; g.beginPath(); g.moveTo(3, 30); g.lineTo(4, 22); g.lineTo(9, 17); g.lineTo(17, 18); g.lineTo(21, 23); g.lineTo(21, 30); g.fill();
    g.fillStyle = '#e0b478'; g.beginPath(); g.moveTo(5, 22); g.lineTo(9, 18); g.lineTo(17, 19); g.lineTo(19, 22); g.fill();
    g.fillStyle = '#c89a60'; g.fillRect(4, 24, 17, 1); g.fillRect(4, 27, 17, 1); g.fillStyle = '#9a6a3a'; g.fillRect(13, 25, 6, 1);
  })];
  // salina: crosta branca rachada
  S[23] = [mk(g => {
    el(g, 12, 28, 10, 3.6, '#d8d0c0'); el(g, 12, 27.4, 9, 3, '#f6f2ea');
    g.fillStyle = '#c8bca8'; g.fillRect(6, 27, 4, 1); g.fillRect(11, 28, 1, 2); g.fillRect(14, 26, 5, 1);
    g.fillStyle = '#ffffff'; for (const [x, y] of [[8, 26], [13, 27], [17, 28]]) g.fillRect(x, y, 2, 1);
  })];
  // salgueiro do pântano: copa caída
  S[24] = ['#5a7a3a', '#4f7034'].map(col => mk(g => {
    shadow(g, 9);
    g.fillStyle = '#5a4026'; g.fillRect(10, 16, 4, 14); g.fillStyle = '#3f2c18'; g.fillRect(13, 16, 1, 14);
    circ(g, 12, 11, 8, U.shade(col, -0.05)); circ(g, 8, 12, 5, col); circ(g, 16, 12, 5, col);
    g.strokeStyle = U.shade(col, 0.12); g.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) { const x = 4 + k * 2; g.beginPath(); g.moveTo(x, 10 + (k % 3)); g.lineTo(x + (k % 2 ? 0.5 : -0.5), 20 + (k % 4) * 1.5); g.stroke(); }
    if (snow) { g.fillStyle = '#f2f6f8'; g.fillRect(6, 5, 12, 2); }
  }));
  // junco: hastes com espigas marrons
  S[25] = [mk(g => {
    g.strokeStyle = '#6a8a3a'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(6 + k * 2, 30); g.lineTo(5 + k * 2.3, 17 + (k % 3) * 2); g.stroke(); }
    g.fillStyle = '#6a4226'; for (const [x, y] of [[5, 15], [9, 18], [12, 16], [16, 19], [19, 17]]) g.fillRect(x, y, 2, 4);
  })];
  // cogumelos vermelhos com pintas
  S[26] = [mk(g => {
    for (const [x, h, r] of [[9, 6, 4], [15, 4, 3], [12, 3, 2.4]]) {
      g.fillStyle = '#efe6d0'; g.fillRect(x - 1, 30 - h, 2, h);
      g.fillStyle = '#c8384a'; g.beginPath(); g.arc(x, 30 - h, r, Math.PI, 0); g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(x - 1, 29 - h - r * 0.5, 1, 1); g.fillRect(x + 1, 30 - h - r * 0.3, 1, 1);
    }
  })];
  // turfeira: barranco escuro
  S[27] = [mk(g => {
    el(g, 12, 28, 9, 3.6, '#2e2218'); el(g, 12, 27, 8, 2.8, '#4a3626');
    g.fillStyle = '#5e4632'; g.fillRect(7, 26, 4, 1); g.fillRect(13, 27, 3, 1); g.fillStyle = '#6a8a3a'; g.fillRect(5, 25, 2, 1); g.fillRect(17, 25, 2, 1);
  })];
  // líquen sobre pedrinhas
  S[28] = [mk(g => {
    el(g, 12, 28, 7, 2.6, '#8a8f86'); el(g, 9, 27, 3, 2, '#c9c48e'); el(g, 15, 27.5, 3.4, 1.8, '#d8d098'); el(g, 12, 26.6, 2, 1.2, '#a8b07a');
  })];
  // arbusto seco
  S[29] = [mk(g => {
    g.strokeStyle = '#8a7444'; g.lineWidth = 1;
    for (const [dx, dy] of [[-7, -8], [-4, -10], [0, -11], [4, -9], [7, -7], [-2, -6], [3, -6]]) { g.beginPath(); g.moveTo(12, 30); g.lineTo(12 + dx, 30 + dy); g.stroke(); }
    g.fillStyle = '#b8a060'; for (const [x, y] of [[6, 22], [9, 20], [13, 19], [16, 21], [18, 23]]) g.fillRect(x, y, 2, 1);
  })];
  // veio de âmbar
  S[30] = [mk(g => {
    shadow(g);
    g.fillStyle = '#6e6e6e'; g.beginPath(); g.moveTo(3, 30); g.lineTo(5, 21); g.lineTo(11, 17); g.lineTo(18, 19); g.lineTo(21, 30); g.fill();
    g.fillStyle = '#9b9b9b'; g.beginPath(); g.moveTo(5, 22); g.lineTo(11, 17); g.lineTo(18, 19); g.lineTo(15, 23); g.lineTo(8, 24); g.fill();
    for (const [x, y] of [[8, 25], [14, 21], [12, 27], [17, 26]]) { g.fillStyle = '#e8a030'; g.fillRect(x, y, 3, 2); g.fillStyle = '#ffd890'; g.fillRect(x, y, 1, 1); }
  })];
  // acácia: copa achatada de guarda-chuva
  S[31] = [mk(g => {
    shadow(g, 10);
    g.strokeStyle = '#5a4026'; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(12, 30); g.lineTo(12, 18); g.lineTo(7, 11); g.moveTo(12, 18); g.lineTo(17, 11); g.stroke();
    el(g, 12, 9, 11, 3.6, snow ? '#e8eef2' : '#5a7a2a'); el(g, 12, 7.6, 9, 2.4, snow ? '#ffffff' : '#6e8a34');
    g.fillStyle = snow ? '#ffffff' : '#88a048'; for (const [x, y] of [[5, 8], [10, 6], [16, 7], [19, 9]]) g.fillRect(x, y, 2, 1);
  }, 24, 32)];
};
