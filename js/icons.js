'use strict';
// Ícones vetoriais (SVG) usados na interface.

const ICON_PATHS = {
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  hammer: '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
  build: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  crown: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path fill="currentColor" stroke="none" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  bolt: '<path fill="currentColor" stroke="none" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  food: '<path fill="currentColor" stroke="none" d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5" stroke-dasharray="2 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9 7h7M9 11h5"/>',
  castle: '<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4"/><path d="M22 11V9M2 11V9M6 4V2M18 4V2M10 4V2M14 4V2"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  run: '<circle cx="14.5" cy="4" r="2" fill="currentColor"/><path d="M8 21l3-6 3 2v5M6 12l3-4 4 1 3 3 3 1M11 15l-2-3"/>',
  star: '<path fill="currentColor" stroke="none" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
};

function icon(name, cls) {
  return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

// ================================================================ ícones desenhados dos itens (armas, ferramentas, roupas e materiais)
// Cada item ganha um desenho com a cor do seu material: um machado de bronze é diferente de um de aço.
// Os desenhos aparecem nas janelas (mochila, criar, lojas...); as mensagens continuam com o emoji.
const MAT = {
  stone: ['#9a9a98', '#6e6e6c', '#c9c9c4'], bronze: ['#cd8a4a', '#8f5a28', '#f2bd80'], iron: ['#8d949c', '#5d646c', '#c4cad0'],
  steel: ['#c9d4de', '#7f8c99', '#f5f9fc'], silver: ['#dde2e8', '#9aa3ad', '#ffffff'], gold: ['#f2c14a', '#b8862a', '#fff0a8'],
  bone: ['#e6dcc4', '#a89c80', '#fff8e6'], wood: ['#9a6a3a', '#6b4420', '#c99a64'], yew: ['#7a4a2a', '#4e2c14', '#b07a4a'],
  crystal: ['#9fe3f0', '#4aa9c4', '#effcff'], dragon: ['#c0402e', '#7a1e14', '#ff9a7a'], ancient: ['#78b4a2', '#3e6a5e', '#cdf2e5'],
  troll: ['#6f7a4a', '#454d2a', '#a8b878'], leather: ['#8a5a2e', '#5a3618', '#bb8850'], hard: ['#5e3416', '#3a1e0a', '#8f5a2e'],
  linen: ['#d8cfb4', '#a89f84', '#f4ecd6'], wool: ['#b9a27a', '#7f6a48', '#e2d0aa'], silk: ['#e2c6f0', '#a07ab8', '#fbf2ff'],
  wolf: ['#8d8f96', '#55575c', '#c8cad0'], fox: ['#d0682a', '#8a3e14', '#f8c89e'], bear: ['#5a3a22', '#36220f', '#8e6442'],
  rabbit: ['#e0d4bc', '#a89a80', '#fffaee'], copper: ['#d9773a', '#9a4a1a', '#f6b07a'], tin: ['#cfd3d6', '#8f969c', '#ffffff'], horn: ['#d8c8a0', '#8a7650', '#f8ecc8'],
};
const ART_ITEMS = {
  // ferramentas
  stone_axe: ['axe', 'stone'], bronze_axe: ['axe', 'bronze'], iron_axe: ['axe', 'iron'], steel_axe: ['axe', 'steel'],
  stone_pick: ['pick', 'stone'], bronze_pick: ['pick', 'bronze'], iron_pick: ['pick', 'iron'], steel_pick: ['pick', 'steel'], hoe: ['hoe', 'iron'], stone_shovel: ['shovel', 'stone'], iron_shovel: ['shovel', 'iron'], dirt: ['mound', 'wood'],
  // armas
  battle_axe: ['axe2', 'iron'], war_axe: ['axe2', 'steel'], bronze_sword: ['sword', 'bronze'], iron_sword: ['sword', 'iron'], steel_sword: ['sword', 'steel'],
  silver_sword: ['sword', 'silver'], royal_sword: ['sword', 'gold'], ancient_blade: ['sword', 'ancient'], bone_knife: ['knife', 'bone'],
  stone_spear: ['spear', 'stone'], iron_spear: ['spear', 'iron'], club: ['club', 'wood'], troll_club: ['club', 'troll'], iron_mace: ['mace', 'iron'],
  short_bow: ['bow', 'wood'], yew_bow: ['bow', 'yew'], horn_bow: ['bow', 'horn'], bear_claws: ['claw', 'bone'],
  // escudos e cabeça
  wood_shield: ['shield', 'wood'], iron_shield: ['shield', 'iron'], steel_shield: ['shield', 'steel'],
  linen_hood: ['hood', 'linen'], leather_cap: ['hood', 'leather'], silk_hood: ['hood', 'silk'], fox_hood: ['hood', 'fox'],
  bronze_helm: ['helm', 'bronze'], iron_helm: ['helm', 'iron'], steel_helm: ['helm', 'steel'], antler_helm: ['antler', 'bone'], royal_helm: ['crown', 'gold'], crystal_crown: ['crown', 'crystal'],
  // corpo, pernas e pés
  linen_tunic: ['tunic', 'linen'], leather_jerkin: ['tunic', 'leather'], hard_jerkin: ['tunic', 'hard'], wool_cloak: ['cloak', 'wool'], wolf_cloak: ['cloak', 'wolf'], bear_coat: ['cloak', 'bear'],
  bronze_cuirass: ['cuirass', 'bronze'], chainmail: ['mail', 'iron'], plate_armor: ['cuirass', 'steel'], dragon_mail: ['mail', 'dragon'],
  linen_pants: ['pants', 'linen'], leather_breeches: ['pants', 'leather'], bronze_greaves: ['greaves', 'bronze'], iron_greaves: ['greaves', 'iron'], steel_greaves: ['greaves', 'steel'],
  leather_boots: ['boots', 'leather'], rabbit_boots: ['boots', 'rabbit'], bronze_boots: ['iboots', 'bronze'], iron_boots: ['iboots', 'iron'], steel_sabatons: ['iboots', 'steel'],
  // materiais
  bronze_bar: ['bar', 'bronze'], iron_bar: ['bar', 'iron'], steel_bar: ['bar', 'steel'], silver_bar: ['bar', 'silver'], gold_bar: ['bar', 'gold'],
  copper_ore: ['ore', 'copper'], tin_ore: ['ore', 'tin'], iron_ore: ['ore', 'iron'], silver_ore: ['ore', 'silver'], gold_ore: ['nugget', 'gold'],
  leather: ['hide', 'leather'], hard_leather: ['hide', 'hard'], wolf_pelt: ['pelt', 'wolf'], fox_pelt: ['pelt', 'fox'], bear_pelt: ['pelt', 'bear'], rabbit_hide: ['pelt', 'rabbit'],
  goat_horn: ['horn', 'horn'], bear_claw: ['clawi', 'bone'],
};
const ART_SHAPES = {
  // cabo de madeira na diagonal + cabeça do material
  axe: (m, d, l) => `<path d="M9 28 L22 9" stroke="#6b4420" stroke-width="3.2" stroke-linecap="round"/><path d="M17 6 Q27 4 28 14 Q22 13 19 16 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M20 8 Q25 7 26 11" stroke="${l}" stroke-width="1.2" fill="none"/>`,
  axe2: (m, d, l) => `<path d="M8 29 L22 7" stroke="#5a3618" stroke-width="3.4" stroke-linecap="round"/><path d="M18 4 Q30 4 29 17 Q23 14 20 16 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M19 9 Q10 6 9 15 Q14 12 17 13 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M21 7 Q27 7 27 12" stroke="${l}" stroke-width="1.2" fill="none"/>`,
  pick: (m, d, l) => `<path d="M10 28 L20 10" stroke="#6b4420" stroke-width="3.2" stroke-linecap="round"/><path d="M5 9 Q16 1 29 12 L27 14 Q17 6 7 11 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M9 8 Q16 4 23 8" stroke="${l}" stroke-width="1.1" fill="none"/>`,
  shovel: (m, d, l) => `<path d="M9 27 L21 11" stroke="#6b4420" stroke-width="3" stroke-linecap="round"/><path d="M6 30 L4 26 L10 26 Z" fill="#6b4420"/><path d="M19 13 Q18 6 23 4 Q29 3 29 9 Q27 14 21 14 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M22 7 Q24 5 27 6" stroke="${l}" stroke-width="1.2" fill="none"/>`,
  mound: () => `<path d="M3 26 Q6 14 16 12 Q26 13 29 26 Z" fill="#7a5230" stroke="#4a2e16" stroke-width="1.3"/><circle cx="11" cy="21" r="1.4" fill="#5a3a1e"/><circle cx="19" cy="18" r="1.2" fill="#5a3a1e"/><circle cx="22" cy="23" r="1.5" fill="#a07a4a"/><path d="M10 16 Q14 13 18 14" stroke="#a07a4a" stroke-width="1.3" fill="none"/>`,
  hoe: (m, d, l) => `<path d="M8 29 L22 8" stroke="#6b4420" stroke-width="3" stroke-linecap="round"/><path d="M19 7 L28 7 L27 13 L21 11 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/>`,
  sword: (m, d, l) => `<path d="M24 4 L27 5 L14 20 L11 18 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M24 5 L15 16" stroke="${l}" stroke-width="1"/><path d="M8 15 L16 23" stroke="#b8862a" stroke-width="3" stroke-linecap="round"/><path d="M11 21 L6 26" stroke="#5a3618" stroke-width="3" stroke-linecap="round"/><circle cx="5" cy="27" r="2.2" fill="${d}"/>`,
  knife: (m, d, l) => `<path d="M22 6 Q27 8 20 16 L16 13 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M16 14 L8 24" stroke="#6b4420" stroke-width="4" stroke-linecap="round"/>`,
  spear: (m, d, l) => `<path d="M6 29 L23 9" stroke="#7a5230" stroke-width="2.6" stroke-linecap="round"/><path d="M22 3 L29 3 L28 10 L22 12 L20 10 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/>`,
  club: (m, d, l) => `<path d="M8 28 L16 17" stroke="#6b4420" stroke-width="3.4" stroke-linecap="round"/><path d="M14 18 Q12 8 21 5 Q29 5 27 13 Q23 20 14 18 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><circle cx="21" cy="10" r="1.4" fill="${d}"/><circle cx="24" cy="14" r="1.2" fill="${d}"/>`,
  mace: (m, d, l) => `<path d="M7 28 L17 15" stroke="#5a3618" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="11" r="7" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M20 2 L20 5 M27 11 L29 11 M20 17 L20 20 M13 11 L11 11 M25 6 L27 4 M25 16 L27 18" stroke="${d}" stroke-width="2"/><circle cx="18" cy="9" r="2" fill="${l}"/>`,
  bow: (m, d, l) => `<path d="M9 4 Q28 16 9 28" fill="none" stroke="${m}" stroke-width="3.2" stroke-linecap="round"/><path d="M9 4 Q28 16 9 28" fill="none" stroke="${d}" stroke-width="1" stroke-dasharray="2 4"/><path d="M9 4 L9 28" stroke="#efe6cf" stroke-width="1"/><path d="M5 16 L22 16" stroke="#8a6a40" stroke-width="1.6"/><path d="M22 16 L18 13 M22 16 L18 19" stroke="#c9c9c4" stroke-width="1.6"/>`,
  claw: (m, d, l) => `<path d="M8 24 Q10 14 17 12 L22 14 Q18 22 12 26 Z" fill="#5a3618"/><path d="M15 12 Q17 4 23 3 Q20 8 19 12 Z M19 13 Q24 7 29 8 Q24 11 22 15 Z M21 16 Q27 13 30 16 Q25 17 22 19 Z" fill="${m}" stroke="${d}" stroke-width="1"/>`,
  shield: (m, d, l) => `<path d="M16 3 L27 7 Q27 20 16 29 Q5 20 5 7 Z" fill="${m}" stroke="${d}" stroke-width="1.8"/><path d="M16 6 L16 26 M8 12 L24 12" stroke="${d}" stroke-width="1.4" opacity=".6"/><circle cx="16" cy="13" r="3" fill="${l}" stroke="${d}"/>`,
  hood: (m, d, l) => `<path d="M6 26 Q5 8 16 5 Q27 8 26 26 L21 26 Q22 15 16 14 Q10 15 11 26 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M11 25 Q10 16 16 15 Q22 16 21 25 Z" fill="#2a1e14" opacity=".55"/><path d="M10 9 Q16 5 22 9" stroke="${l}" stroke-width="1.3" fill="none"/>`,
  helm: (m, d, l) => `<path d="M6 22 Q6 6 16 5 Q26 6 26 22 Z" fill="${m}" stroke="${d}" stroke-width="1.5"/><rect x="5" y="20" width="22" height="5" rx="1.5" fill="${d}"/><path d="M15 9 L15 22 L17 22 L17 9 Z" fill="${d}"/><path d="M9 12 Q12 7 16 7" stroke="${l}" stroke-width="1.4" fill="none"/>`,
  antler: (m, d, l) => `<path d="M8 24 Q8 12 16 12 Q24 12 24 24 Z" fill="#8a5a2e" stroke="#5a3618" stroke-width="1.4"/><path d="M11 13 L7 5 M8 8 L4 7 M21 13 L25 5 M24 8 L28 7" stroke="${m}" stroke-width="2.4" stroke-linecap="round"/>`,
  crown: (m, d, l) => `<path d="M5 24 L5 11 L11 17 L16 7 L21 17 L27 11 L27 24 Z" fill="${m}" stroke="${d}" stroke-width="1.5"/><rect x="5" y="22" width="22" height="4" fill="${d}"/><circle cx="16" cy="18" r="2" fill="#c0302a"/><circle cx="10" cy="20" r="1.4" fill="#2a6ec0"/><circle cx="22" cy="20" r="1.4" fill="#2a9a4a"/>`,
  tunic: (m, d, l) => `<path d="M10 5 L13 7 Q16 9 19 7 L22 5 L29 10 L25 15 L23 13 L23 28 L9 28 L9 13 L7 15 L3 10 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M13 7 Q16 12 19 7" stroke="${d}" stroke-width="1.2" fill="none"/><path d="M9 20 L23 20" stroke="${d}" stroke-width="2"/>`,
  cloak: (m, d, l) => `<path d="M11 4 L21 4 L27 28 L5 28 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M11 4 Q16 9 21 4" fill="${l}"/><circle cx="16" cy="7" r="2" fill="#d9b45a" stroke="#8a6a20"/><path d="M12 12 L9 27 M20 12 L23 27 M16 12 L16 27" stroke="${d}" stroke-width="1" opacity=".6"/>`,
  cuirass: (m, d, l) => `<path d="M8 6 L13 5 Q16 8 19 5 L24 6 L25 18 Q16 30 7 18 Z" fill="${m}" stroke="${d}" stroke-width="1.5"/><path d="M16 9 L16 25" stroke="${d}" stroke-width="1.2"/><path d="M10 10 Q13 9 14 12" stroke="${l}" stroke-width="1.4" fill="none"/><path d="M9 18 Q16 22 23 18" stroke="${d}" stroke-width="1.2" fill="none"/>`,
  mail: (m, d, l) => `<path d="M10 5 L13 7 Q16 9 19 7 L22 5 L28 10 L24 14 L23 28 L9 28 L8 14 L4 10 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/>` + [10, 14, 18, 22, 26].map(y => [11, 15, 19].map(x => `<circle cx="${x + (y % 8 ? 2 : 0)}" cy="${y}" r="1.6" fill="none" stroke="${d}" stroke-width=".9"/>`).join('')).join(''),
  pants: (m, d, l) => `<path d="M8 4 L24 4 L25 28 L18 28 L16 13 L14 28 L7 28 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><rect x="8" y="4" width="16" height="3" fill="${d}"/>`,
  greaves: (m, d, l) => `<path d="M9 4 L14 4 L14 27 L8 27 Z M18 4 L23 4 L24 27 L18 27 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M9 14 L14 14 M18 14 L23 14" stroke="${d}" stroke-width="2"/><path d="M10 6 L10 12 M19 6 L19 12" stroke="${l}" stroke-width="1.2"/>`,
  boots: (m, d, l) => `<path d="M7 5 L15 5 L15 21 L26 22 Q28 27 25 28 L7 28 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M7 26 L26 26" stroke="${d}" stroke-width="2"/><path d="M7 8 L15 8" stroke="${l}" stroke-width="2"/>`,
  iboots: (m, d, l) => `<path d="M7 5 L15 5 L15 20 L25 21 Q29 27 25 28 L7 28 Z" fill="${m}" stroke="${d}" stroke-width="1.5"/><path d="M7 10 L15 10 M7 15 L15 15 M15 20 L15 28" stroke="${d}" stroke-width="1.3"/><path d="M9 6 L9 26" stroke="${l}" stroke-width="1.2"/>`,
  bar: (m, d, l) => `<path d="M4 20 L10 12 L28 12 L22 20 Z" fill="${l}" stroke="${d}" stroke-width="1.2"/><path d="M4 20 L22 20 L22 26 L4 26 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M22 20 L28 12 L28 18 L22 26 Z" fill="${d}"/>`,
  ore: (m, d, l) => `<path d="M5 24 L8 12 L16 7 L25 10 L28 21 L20 27 L10 27 Z" fill="#7a7a78" stroke="#4e4e4c" stroke-width="1.3"/><circle cx="13" cy="15" r="2.6" fill="${m}"/><circle cx="20" cy="19" r="2.2" fill="${m}"/><circle cx="17" cy="11" r="1.6" fill="${l}"/><circle cx="11" cy="22" r="1.6" fill="${m}"/>`,
  nugget: (m, d, l) => `<path d="M7 20 Q6 11 14 9 Q22 6 26 13 Q29 21 21 25 Q11 28 7 20 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M12 13 Q16 10 20 12" stroke="${l}" stroke-width="1.6" fill="none"/>`,
  hide: (m, d, l) => `<path d="M6 7 Q11 9 16 6 Q21 9 26 7 Q24 13 27 17 Q23 20 25 26 Q20 24 16 27 Q12 24 7 26 Q9 20 5 17 Q8 13 6 7 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M11 12 Q16 14 21 12 M11 20 Q16 18 21 20" stroke="${l}" stroke-width="1" fill="none"/>`,
  pelt: (m, d, l) => `<path d="M5 9 Q10 5 16 8 Q22 5 27 9 Q25 15 28 20 Q22 21 24 27 Q18 24 16 28 Q14 24 8 27 Q10 21 4 20 Q7 15 5 9 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M9 12 L11 14 M14 11 L15 13 M19 11 L18 13 M23 12 L21 14 M12 20 L13 22 M19 20 L18 22" stroke="${d}" stroke-width="1.2"/><path d="M13 16 Q16 14 19 16" stroke="${l}" stroke-width="1.6" fill="none"/>`,
  horn: (m, d, l) => `<path d="M7 26 Q5 12 14 6 Q22 2 27 8 Q20 7 17 12 Q13 18 13 26 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M9 20 L13 20 M9 15 L14 15 M12 10 L16 11" stroke="${d}" stroke-width="1.2"/>`,
  clawi: (m, d, l) => `<path d="M8 27 Q6 14 15 6 Q24 2 27 6 Q19 9 16 16 Q13 22 14 27 Z" fill="${m}" stroke="${d}" stroke-width="1.4"/><path d="M12 22 Q12 14 18 9" stroke="${l}" stroke-width="1.2" fill="none"/>`,
};
const ART_CACHE = {};
function itemArt(k) {
  if (k in ART_CACHE) return ART_CACHE[k];
  const a = ART_ITEMS[k], shape = a && ART_SHAPES[a[0]], pal = a && MAT[a[1]];
  return (ART_CACHE[k] = shape && pal ? `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">${shape(pal[0], pal[1], pal[2])}</svg>` : null);
}
