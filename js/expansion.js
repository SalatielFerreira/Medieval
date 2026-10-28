'use strict';
// Expansão: o dobro de matérias-primas, materiais, ferramentas, armas, armaduras, comidas e objetos.
// Tudo tem origem e destino: cada matéria-prima sai de algum lugar do mundo (árvores, rochas, veios, ervas, animais,
// monstros, criações, pesca ou lojas) e entra em alguma receita; cada item feito tem a sua estação de trabalho e é
// vendido em alguma loja; ferramentas têm uma função de verdade (foice, tesoura, rede, lanterna, gazua...), as armas
// mágicas gastam energia em vez de flechas, os pergaminhos lançam magias e os instrumentos animam a taverna.

// ------------------------------------------------------------------ cores dos materiais (ícones)
Object.assign(MAT, {
  glass: ['#a8d8e8', '#4a8aa0', '#e8f8ff'], brass: ['#d8b040', '#8a6a10', '#f8e090'], pewter: ['#9aa0a8', '#5a6068', '#d8dce0'],
  mithril: ['#b8e0f0', '#5a8aa8', '#f4fcff'], electrum: ['#e8d890', '#9a8a3a', '#fff8c8'], obsidian: ['#3a3048', '#120c1c', '#7a6a9a'],
  marble: ['#ece8e0', '#a8a49a', '#ffffff'], granite: ['#8a7a78', '#4a3e3c', '#b8aaa6'], lime: ['#d8d0b0', '#9a9070', '#f4ecd0'],
  sulfur: ['#e8d84a', '#9a8a1a', '#fff890'], quartz: ['#e8e0f0', '#a098b8', '#ffffff'], amethyst: ['#9a5ad8', '#5a2a8a', '#d8b0ff'],
  emerald: ['#3ac87a', '#1a7a4a', '#a8f8c8'], sapphire: ['#3a6ae0', '#1a3a8a', '#a8c8ff'], olive: ['#7a8a3a', '#4a5a1a', '#b8c878'],
  purple: ['#8a3a9a', '#4a1a5a', '#d090e0'], blue: ['#3a5ad0', '#1a2a7a', '#9ab0ff'], yellow: ['#e8c830', '#9a7a10', '#fff090'],
  black: ['#2e2e34', '#0a0a0c', '#5a5a64'], white: ['#f4f2ec', '#b0aca0', '#ffffff'], pumpkin: ['#e8862a', '#9a4a0a', '#ffc880'],
  onion: ['#d8a8c0', '#8a5a7a', '#f8e0ec'], turnip: ['#ece4f2', '#8a6aa0', '#ffffff'], bean: ['#8a5a3a', '#4a2a1a', '#c8986a'],
  pea: ['#7ac04a', '#3a7a1a', '#c8f0a0'], tar: ['#2a2420', '#000000', '#5a5048'], ecto: ['#8af0c8', '#3a9a7a', '#e0fff0'],
  venom: ['#7ad83a', '#3a7a1a', '#d0ffa0'], fire: ['#ff6a1a', '#a82a0a', '#ffd06a'], frost: ['#8ad8ff', '#3a7ab0', '#e8f8ff'],
  storm: ['#b8a8ff', '#5a4ab0', '#f0eaff'], arcane: ['#c84ae0', '#6a1a8a', '#f4c0ff'], holy: ['#f8e8a0', '#b8983a', '#ffffff'],
  paper: ['#f0e8d0', '#a89a78', '#ffffff'], ink: ['#1a2a4a', '#0a1020', '#4a6a9a'], felt: ['#7a5a4a', '#4a3428', '#a88a78'],
  cocoon: ['#f4f0e0', '#c0b8a0', '#ffffff'], sunflower: ['#f0c830', '#7a5a10', '#fff090'], hops: ['#8ac84a', '#4a7a1a', '#d0f0a0'],
  lavender: ['#9a7ad8', '#5a4a8a', '#d8c8ff'], rose: ['#e04a6a', '#8a1a3a', '#ffb0c0'], ice: ['#d8f0ff', '#7ab0d0', '#ffffff'],
  shell: ['#f0d8c8', '#a8846a', '#fff4ec'], kelp: ['#3a7a4a', '#1a4a2a', '#7ac08a'], rune: ['#6a7aa0', '#2a3a5a', '#a8f0ff'],
  bark: ['#7a5a3a', '#4a3020', '#a8845a'], noble: ['#6a2a5a', '#3a1030', '#c070a8'], ranger: ['#4a6a3a', '#24381a', '#88a870'],
  mage: ['#3a3a8a', '#1a1a4a', '#8a8ae0'], scalec: ['#7a8a6a', '#3a4a2a', '#b8c8a0'], padded: ['#c8b890', '#7a6a48', '#ece0c0'],
});

// ------------------------------------------------------------------ desenhos novos (ferramentas, magia, música)
Object.assign(ART_SHAPES, {
  staff: (m, d, l) => `<path d="M7 29 L21 9" stroke="#6a4423" stroke-width="2.6" stroke-linecap="round"/><path d="M19 10 Q17 4 22 3 Q27 4 25 10 Z" fill="${d}"/><circle cx="22" cy="7" r="4.2" fill="${m}" stroke="${d}" stroke-width="1.2"/><circle cx="21" cy="5.8" r="1.4" fill="${l}"/><path d="M14 2 L15 4 M28 12 L30 13 M27 2 L26 4" stroke="${l}" stroke-width="1.2" stroke-linecap="round"/>`,
  wand: (m, d, l) => `<path d="M6 27 L22 9" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/><path d="M6 27 L12 20" stroke="#3a2a1a" stroke-width="3" stroke-linecap="round"/><path d="M23 4 L24.5 7.5 L28 8 L25.2 10.3 L26 14 L23 12 L20 14 L20.8 10.3 L18 8 L21.5 7.5 Z" fill="${m}" stroke="${d}" stroke-width=".9"/><circle cx="23" cy="9" r="1.2" fill="${l}"/>`,
  orb: (m, d, l) => `<path d="M9 28 L23 28 L21 24 L11 24 Z" fill="#8a6a30" stroke="#4a3418" stroke-width="1"/><circle cx="16" cy="14" r="10" fill="${m}" stroke="${d}" stroke-width="1.4"/><circle cx="12.5" cy="10.5" r="3.4" fill="${l}" opacity=".8"/><path d="M10 17 Q16 21 22 15" stroke="${l}" stroke-width="1" fill="none" opacity=".6"/>`,
  lantern: (m, d, l) => `<path d="M12 6 Q16 1 20 6" stroke="#3a3a40" stroke-width="1.6" fill="none"/><rect x="10" y="6" width="12" height="3" rx="1" fill="#4a4a52"/><rect x="11" y="9" width="10" height="15" rx="2" fill="${m}" stroke="#3a3a40" stroke-width="1.4"/><path d="M16 21 Q12 17 16 12 Q20 17 16 21 Z" fill="#ffb030"/><path d="M16 20 Q14 17.5 16 15 Q18 17.5 16 20 Z" fill="#fff0a0"/><rect x="10" y="24" width="12" height="3" rx="1" fill="#4a4a52"/>`,
  compass: (m, d, l) => `<circle cx="16" cy="16" r="12" fill="${m}" stroke="${d}" stroke-width="1.6"/><circle cx="16" cy="16" r="9.4" fill="#f4ecd8" stroke="${d}" stroke-width=".8"/><path d="M16 8 L18.4 16 L16 24 L13.6 16 Z" fill="#c8302a"/><path d="M16 16 L18.4 16 L16 24 L13.6 16 Z" fill="#3a3a48"/><circle cx="16" cy="16" r="1.4" fill="${d}"/><path d="M16 4 L16 6 M16 26 L16 28 M4 16 L6 16 M26 16 L28 16" stroke="${d}" stroke-width="1.2"/>`,
  spyglass: (m, d, l) => `<path d="M4 22 L22 10 L25 15 L7 27 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M20 8 L27 4 L30 10 L23 14 Z" fill="${d}"/><path d="M11 19.4 L13 22.6 M16 16 L18 19.2" stroke="${l}" stroke-width="1.4"/><ellipse cx="28.5" cy="7" rx="1.4" ry="3" transform="rotate(-33 28.5 7)" fill="#a8d8e8"/>`,
  net: (m, d, l) => `<path d="M5 8 Q16 2 27 8 L24 26 Q16 30 8 26 Z" fill="${m}" opacity=".35" stroke="${d}" stroke-width="1.4"/><path d="M8 8 L11 27 M13 6 L14 28 M19 6 L18 28 M24 8 L21 27 M6 13 L26 13 M7 19 L25 19 M8 24 L24 24" stroke="${d}" stroke-width=".9"/><circle cx="5" cy="8" r="1.6" fill="${l}"/><circle cx="27" cy="8" r="1.6" fill="${l}"/>`,
  saw: (m, d, l) => `<path d="M4 18 L24 10 L27 16 L7 24 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M7 24 L8 26 L10 23 L11 25 L13 22 L14 24 L16 21 L17 23 L19 20 L20 22 L22 19 L23 21 L25 18 L27 16" stroke="${d}" stroke-width="1" fill="${l}"/><rect x="23" y="5" width="7" height="10" rx="2" transform="rotate(-22 26 10)" fill="#8a5a2e" stroke="#4a2e16" stroke-width="1.1"/>`,
  hammer: (m, d, l) => `<path d="M8 28 L19 13" stroke="#7a4a24" stroke-width="3.2" stroke-linecap="round"/><path d="M12 9 L22 3 L28 12 L18 18 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M14 9.5 L22 5" stroke="${l}" stroke-width="1.4"/>`,
  sickle: (m, d, l) => `<path d="M8 28 L12 21" stroke="#7a4a24" stroke-width="3.2" stroke-linecap="round"/><path d="M12 21 Q4 12 12 5 Q22 0 28 8 Q20 5 15 9 Q11 14 14 20 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M15 7 Q20 4 25 7" stroke="${l}" stroke-width="1.2" fill="none"/>`,
  shears: (m, d, l) => `<path d="M10 4 L22 24 M22 4 L10 24" stroke="${m}" stroke-width="3" stroke-linecap="round"/><path d="M10 4 L16 14 M22 4 L16 14" stroke="${l}" stroke-width="1"/><circle cx="16" cy="14" r="1.6" fill="${d}"/><circle cx="9" cy="26" r="3.4" fill="none" stroke="#7a4a24" stroke-width="2"/><circle cx="23" cy="26" r="3.4" fill="none" stroke="#7a4a24" stroke-width="2"/>`,
  keys: (m, d, l) => `<circle cx="10" cy="10" r="5.5" fill="none" stroke="${m}" stroke-width="2.4"/><path d="M14 14 L27 27 M22 22 L25 19 M25 25 L28 22" stroke="${m}" stroke-width="2.4" stroke-linecap="round"/><path d="M9 5.5 Q12 6 13.5 9" stroke="${l}" stroke-width="1" fill="none"/><path d="M18 6 L26 6 M24 6 L24 9" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`,
  tongs: (m, d, l) => `<path d="M6 28 L18 8 L22 4 M10 28 L20 10 L26 6" stroke="${m}" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="15" cy="14" r="1.6" fill="${d}"/><rect x="20" y="1" width="8" height="6" rx="1" transform="rotate(30 24 4)" fill="#e86a2a" stroke="#8a2a0a" stroke-width=".8"/>`,
  fork: (m, d, l) => `<path d="M6 29 L20 11" stroke="#7a4a24" stroke-width="2.6" stroke-linecap="round"/><path d="M17 12 L24 6 L28 3 M19 14 L27 7 L30 5 M15 10 L21 4 L24 1" stroke="${m}" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M16 13 L22 17" stroke="${d}" stroke-width="2"/>`,
  torch: (m, d, l) => `<path d="M11 29 L17 15" stroke="#6a4423" stroke-width="3" stroke-linecap="round"/><rect x="14" y="12" width="6" height="5" rx="1" transform="rotate(22 17 14)" fill="#4a3a2a"/><path d="M18 13 Q11 7 17 1 Q18 6 21 4 Q26 9 18 13 Z" fill="#ff8a1c" stroke="#b84a0a" stroke-width=".8"/><path d="M18 11 Q15 8 18 5 Q20 8 18 11 Z" fill="#ffe070"/>`,
  trap: (m, d, l) => `<ellipse cx="16" cy="22" rx="12" ry="5" fill="${d}"/><path d="M5 20 Q16 6 27 20" stroke="${m}" stroke-width="2.2" fill="none"/>${[7, 10, 13, 16, 19, 22, 25].map(x => `<path d="M${x} ${x < 16 ? 22 - (x - 5) * 1.1 : 22 - (27 - x) * 1.1} l0 -3" stroke="${l}" stroke-width="1.2"/>`).join('')}<path d="M16 22 L16 28 M12 28 L20 28" stroke="${d}" stroke-width="1.6"/>`,
  pestle: (m, d, l) => `<path d="M6 16 L26 16 L23 27 Q16 30 9 27 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><ellipse cx="16" cy="16" rx="10" ry="2.6" fill="${l}" stroke="${d}" stroke-width="1"/><path d="M16 15 L25 3" stroke="#8a6a4a" stroke-width="3.2" stroke-linecap="round"/>`,
  crossbow: (m, d, l) => `<path d="M6 26 L24 8" stroke="#6a4423" stroke-width="3" stroke-linecap="round"/><path d="M8 8 Q16 6 26 18" stroke="${m}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M8 8 L26 18" stroke="${l}" stroke-width=".7"/><path d="M14 18 L22 10" stroke="${d}" stroke-width="1.2"/><path d="M22 10 L25 7 L24 11 Z" fill="${d}"/>`,
  lute: (m, d, l) => `<ellipse cx="12" cy="21" rx="8" ry="7" transform="rotate(-35 12 21)" fill="${m}" stroke="${d}" stroke-width="1.3"/><circle cx="12" cy="21" r="2.2" fill="${d}"/><path d="M15 17 L27 5" stroke="#5a3418" stroke-width="2.6" stroke-linecap="round"/><path d="M26 4 L30 6 L28 8" stroke="#5a3418" stroke-width="2" fill="none"/><path d="M9 24 L26 6" stroke="${l}" stroke-width=".5"/>`,
  flute: (m, d, l) => `<path d="M5 26 L27 6" stroke="${m}" stroke-width="4" stroke-linecap="round"/><path d="M5 26 L27 6" stroke="${l}" stroke-width="1" stroke-linecap="round" opacity=".6"/>${[0, 1, 2, 3].map(k => `<circle cx="${12 + k * 3.4}" cy="${19.6 - k * 3.1}" r="0.9" fill="${d}"/>`).join('')}`,
  drum: (m, d, l) => `<ellipse cx="16" cy="10" rx="11" ry="4" fill="${l}" stroke="${d}" stroke-width="1.2"/><path d="M5 10 L5 23 Q16 29 27 23 L27 10 Q16 16 5 10 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M5 12 L11 25 L16 13 L21 25 L27 12" stroke="${l}" stroke-width="1" fill="none"/><path d="M20 4 L28 0 M24 6 L31 3" stroke="#6a4423" stroke-width="1.6" stroke-linecap="round"/>`,
  hat: (m, d, l) => `<ellipse cx="16" cy="25" rx="13" ry="3.6" fill="${d}"/><path d="M8 24 Q12 14 14 9 Q17 2 24 5 Q19 7 20 14 Q22 20 24 24 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M9 21 Q16 23 23 21" stroke="${l}" stroke-width="1.8" fill="none"/><path d="M15 13 L16.4 15.6 L19 16 L17 18 L17.6 21 L15 19.4" fill="${l}" opacity=".8"/>`,
  robe: (m, d, l) => `<path d="M10 4 L22 4 L25 12 L23 28 L9 28 L7 12 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><path d="M10 4 L16 11 L22 4" stroke="${l}" stroke-width="1.4" fill="none"/><path d="M16 11 L16 28" stroke="${d}" stroke-width="1"/><path d="M7 12 L3 22 L7 23 M25 12 L29 22 L25 23" stroke="${d}" stroke-width="1.2" fill="${m}"/><rect x="9" y="16" width="14" height="2" fill="${l}"/>`,
  halberd: (m, d, l) => `<path d="M7 30 L22 5" stroke="#6a4423" stroke-width="2.4" stroke-linecap="round"/><path d="M19 9 Q26 8 28 13 L21 15 Z" fill="${m}" stroke="${d}" stroke-width="1.1"/><path d="M20 9 L16 7 L18 12 Z" fill="${d}"/><path d="M22 5 L25 1 L23.5 6 Z" fill="${l}" stroke="${d}" stroke-width=".8"/>`,
  flail: (m, d, l) => `<path d="M5 28 L13 18" stroke="#6a4423" stroke-width="3" stroke-linecap="round"/><path d="M13 18 Q17 14 18 12" stroke="#7a7a82" stroke-width="1.4" stroke-dasharray="1.6 1" fill="none"/><circle cx="21" cy="9" r="5.5" fill="${m}" stroke="${d}" stroke-width="1.2"/>${[[21, 2], [28, 9], [21, 16], [14, 9], [26, 4], [26, 14]].map(([x, y]) => `<path d="M21 9 L${x} ${y}" stroke="${d}" stroke-width="1.8"/>`).join('')}<circle cx="19.5" cy="7.5" r="1.6" fill="${l}"/>`,
  blade: (m, d, l) => `<path d="M6 26 L23 5 L26 6 L10 28 Z" fill="${m}" stroke="${d}" stroke-width="1.1"/><path d="M8 26 L24 6" stroke="${l}" stroke-width=".9"/><path d="M4 22 L12 30" stroke="#8a6a2a" stroke-width="2.4" stroke-linecap="round"/><path d="M3 29 L6 26" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/>`,
  necklace: (m, d, l) => `<path d="M6 6 Q4 18 16 24 Q28 18 26 6" stroke="${d}" stroke-width="1" fill="none"/>${[[6, 8], [6, 13], [8, 18], [12, 22], [20, 22], [24, 18], [26, 13], [26, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${m}" stroke="${d}" stroke-width=".6"/>`).join('')}<circle cx="16" cy="26" r="3" fill="${l}" stroke="${d}" stroke-width=".8"/>`,
  mirror: (m, d, l) => `<ellipse cx="16" cy="12" rx="9" ry="10" fill="${m}" stroke="${d}" stroke-width="1.8"/><ellipse cx="16" cy="12" rx="6.6" ry="7.6" fill="#c8e0ec"/><path d="M12 8 Q14 6 17 6" stroke="#ffffff" stroke-width="1.4" fill="none"/><path d="M16 22 L16 30" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`,
  frame: (m, d, l) => `<rect x="3" y="5" width="26" height="22" fill="${m}" stroke="${d}" stroke-width="1.6"/><rect x="6" y="8" width="20" height="16" fill="#8ab0d8"/><path d="M6 24 L12 15 L17 20 L21 16 L26 24 Z" fill="#4a7a3a"/><circle cx="21" cy="12" r="2.2" fill="#f2e070"/>`,
  toy: (m, d, l) => `<path d="M8 12 Q8 6 14 7 L22 7 Q27 8 26 13 L25 18 L9 18 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><path d="M22 7 Q26 2 29 5 Q28 9 25 10" fill="${m}" stroke="${d}" stroke-width="1.1"/><circle cx="26.5" cy="5.8" r=".8" fill="${d}"/><path d="M10 18 L10 25 M15 18 L15 25 M19 18 L19 25 M24 18 L24 25" stroke="${d}" stroke-width="1.6"/><path d="M6 26 Q16 30 28 26" stroke="#6a4423" stroke-width="2" fill="none"/>`,
  horn2: (m, d, l) => `<path d="M4 10 Q16 6 24 16 Q27 20 28 26 L22 26 Q20 20 16 17 Q10 13 4 14 Z" fill="${m}" stroke="${d}" stroke-width="1.2"/><ellipse cx="25" cy="26" rx="3.4" ry="1.6" fill="${d}"/><path d="M8 11 L9 13.8 M13 11 L13.6 14.4 M18 13 L17.4 16" stroke="${l}" stroke-width="1.2"/>`,
  cross: (m, d, l) => `<path d="M13 3 L19 3 L19 10 L26 10 L26 16 L19 16 L19 29 L13 29 L13 16 L6 16 L6 10 L13 10 Z" fill="${m}" stroke="${d}" stroke-width="1.3"/><circle cx="16" cy="13" r="2.4" fill="${l}"/>`,
});

// ------------------------------------------------------------------ itens novos
// [chave, nome, emoji, categoria, preço, extras, ícone [forma, material]]
const EXP_ITEMS = [
  // ---- matérias-primas (42)
  ['bark', 'Casca de Árvore', '🪵', 'Recursos', 2, {}, ['planks', 'bark']],
  ['acorn', 'Bolota', '🌰', 'Recursos', 1, {}, ['berries', 'bark']],
  ['pinecone', 'Pinha', '🌲', 'Recursos', 1, {}, ['fruit', 'bark']],
  ['birch_sap', 'Seiva de Bétula', '💧', 'Recursos', 4, {}, ['jar', 'resin']],
  ['flint', 'Sílex', '🪨', 'Recursos', 3, {}, ['rock', 'black']],
  ['limestone', 'Calcário', '🪨', 'Recursos', 2, {}, ['rock', 'lime']],
  ['granite', 'Granito', '🪨', 'Recursos', 4, {}, ['rock', 'granite']],
  ['marble', 'Mármore', '⬜', 'Recursos', 14, {}, ['rock', 'marble']],
  ['sulfur', 'Enxofre', '🟡', 'Recursos', 6, {}, ['lump', 'sulfur']],
  ['saltpeter', 'Salitre', '⚪', 'Recursos', 7, {}, ['sandpile', 'white']],
  ['quartz', 'Quartzo', '🔹', 'Recursos', 12, {}, ['gem', 'quartz']],
  ['obsidian', 'Obsidiana', '⬛', 'Recursos', 30, {}, ['gem', 'obsidian']],
  ['amethyst', 'Ametista', '💜', 'Recursos', 45, {}, ['gem', 'amethyst']],
  ['emerald', 'Esmeralda', '💚', 'Recursos', 80, {}, ['gem', 'emerald']],
  ['sapphire', 'Safira', '💙', 'Recursos', 85, {}, ['gem', 'sapphire']],
  ['ruby', 'Rubi', '❤️', 'Recursos', 90, {}, ['gem', 'ruby']],
  ['mithril_ore', 'Minério de Mithril', '🔷', 'Recursos', 70, {}, ['ore', 'mithril']],
  ['zinc_ore', 'Calamina (Zinco)', '⚪', 'Recursos', 6, {}, ['ore', 'pewter']],
  ['lead_ore', 'Galena (Chumbo)', '⚫', 'Recursos', 6, {}, ['ore', 'black']],
  ['lavender', 'Lavanda', '💜', 'Recursos', 4, {}, ['herbs', 'lavender']],
  ['rose_petals', 'Pétalas de Rosa', '🌹', 'Recursos', 5, {}, ['berries', 'rose']],
  ['nettle', 'Urtiga', '🌿', 'Recursos', 2, {}, ['herbs', 'green']],
  ['mandrake', 'Raiz de Mandrágora', '🌱', 'Recursos', 30, {}, ['carrot', 'bark']],
  ['moonpetal', 'Flor-da-Lua', '🌼', 'Recursos', 35, {}, ['berries', 'frost']],
  ['wolf_fang', 'Presa de Lobo', '🦷', 'Recursos', 8, {}, ['tusk', 'bone']],
  ['venom_gland', 'Glândula de Veneno', '🟢', 'Recursos', 16, {}, ['egg', 'venom']],
  ['bat_wing', 'Asa de Morcego', '🦇', 'Recursos', 6, {}, ['feather', 'black']],
  ['grave_dust', 'Pó de Sepultura', '💀', 'Recursos', 12, {}, ['sandpile', 'ecto']],
  ['troll_hide', 'Couro de Troll', '🟩', 'Recursos', 120, {}, ['hide', 'troll']],
  ['dragon_heart', 'Coração de Dragão', '❤️‍🔥', 'Recursos', 400, {}, ['meat', 'fire']],
  ['bear_fat', 'Banha de Urso', '🧈', 'Recursos', 10, {}, ['jar', 'cheese']],
  ['olive', 'Azeitona', '🫒', 'Recursos', 3, {}, ['berries', 'olive']],
  ['hops', 'Lúpulo', '🌿', 'Recursos', 3, {}, ['herbs', 'hops']],
  ['sunflower', 'Semente de Girassol', '🌻', 'Recursos', 2, {}, ['seeds', 'sunflower']],
  ['silk_cocoon', 'Casulo de Seda', '🥚', 'Recursos', 9, {}, ['egg', 'cocoon']],
  ['horsehair', 'Crina de Cavalo', '🐎', 'Recursos', 5, {}, ['fiberb', 'bark']],
  ['royal_jelly', 'Geleia Real', '🍯', 'Recursos', 40, {}, ['jar', 'honey']],
  ['ice', 'Gelo', '🧊', 'Recursos', 3, {}, ['gem', 'ice']],
  ['seashell', 'Concha', '🐚', 'Recursos', 4, {}, ['scale', 'shell']],
  ['seaweed', 'Alga Marinha', '🌿', 'Recursos', 2, {}, ['herbs', 'kelp']],
  ['runestone', 'Pedra Rúnica', '🔮', 'Recursos', 60, {}, ['rock', 'rune']],
  ['boar_bristle', 'Cerdas de Javali', '🐗', 'Recursos', 4, {}, ['fiberb', 'black']],
  // ---- sementes (6)
  ['pumpkin_seed', 'Sementes de Abóbora', '🌰', 'Sementes', 2, { seed: 'pumpkin' }, ['seeds', 'pumpkin']],
  ['onion_seed', 'Sementes de Cebola', '🌰', 'Sementes', 2, { seed: 'onion' }, ['seeds', 'onion']],
  ['turnip_seed', 'Sementes de Nabo', '🌰', 'Sementes', 2, { seed: 'turnip' }, ['seeds', 'turnip']],
  ['bean_seed', 'Sementes de Feijão', '🌰', 'Sementes', 2, { seed: 'beans' }, ['seeds', 'bean']],
  ['garlic_seed', 'Dentes de Alho', '🧄', 'Sementes', 3, { seed: 'garlic' }, ['seeds', 'white']],
  ['pea_seed', 'Sementes de Ervilha', '🌰', 'Sementes', 2, { seed: 'peas' }, ['seeds', 'pea']],
  // ---- materiais trabalhados (25)
  ['glass', 'Vidro', '🔷', 'Materiais', 8, {}, ['brick', 'glass']],
  ['vial', 'Frasco de Vidro', '⚗️', 'Materiais', 6, {}, ['flask', 'glass']],
  ['lens', 'Lente Polida', '🔍', 'Materiais', 25, {}, ['gem', 'glass']],
  ['brass_bar', 'Lingote de Latão', '🟨', 'Materiais', 22, {}, ['bar', 'brass']],
  ['pewter_bar', 'Lingote de Estanho-Chumbo', '⬜', 'Materiais', 16, {}, ['bar', 'pewter']],
  ['electrum_bar', 'Lingote de Eletro', '🟨', 'Materiais', 75, {}, ['bar', 'electrum']],
  ['mithril_bar', 'Lingote de Mithril', '🔷', 'Materiais', 160, {}, ['bar', 'mithril']],
  ['quicklime', 'Cal Virgem', '⚪', 'Materiais', 5, {}, ['sack', 'white']],
  ['stone_block', 'Bloco de Pedra', '🧱', 'Materiais', 6, {}, ['brick', 'rock']],
  ['marble_block', 'Bloco de Mármore', '⬜', 'Materiais', 30, {}, ['brick', 'marble']],
  ['pitch', 'Piche', '🛢️', 'Materiais', 6, {}, ['pot', 'tar']],
  ['dye_red', 'Tinta Vermelha', '🔴', 'Materiais', 8, {}, ['jar', 'red']],
  ['dye_blue', 'Tinta Azul', '🔵', 'Materiais', 9, {}, ['jar', 'blue']],
  ['dye_yellow', 'Tinta Amarela', '🟡', 'Materiais', 7, {}, ['jar', 'yellow']],
  ['red_cloth', 'Tecido Escarlate', '🟥', 'Materiais', 20, {}, ['roll', 'red']],
  ['blue_cloth', 'Tecido Anil', '🟦', 'Materiais', 22, {}, ['roll', 'blue']],
  ['paper', 'Papel', '📄', 'Materiais', 4, {}, ['scroll', 'paper']],
  ['ink', 'Tinta de Escrever', '🖋️', 'Materiais', 6, {}, ['bottle', 'ink']],
  ['soap', 'Sabão', '🧼', 'Materiais', 6, {}, ['brick', 'white']],
  ['felt', 'Feltro', '🟫', 'Materiais', 10, {}, ['roll', 'felt']],
  ['silk_thread', 'Fio de Seda', '🧵', 'Materiais', 14, {}, ['rope', 'silkc']],
  ['gold_thread', 'Fio de Ouro', '🧵', 'Materiais', 45, {}, ['rope', 'gold']],
  ['chain_links', 'Elos de Corrente', '⛓️', 'Materiais', 12, {}, ['rope', 'iron']],
  ['bone_meal', 'Farinha de Osso (adubo)', '🦴', 'Materiais', 3, {}, ['sack', 'bone']],
  ['olive_oil', 'Azeite', '🫒', 'Materiais', 9, {}, ['bottle', 'olive']],
  // ---- ferramentas com função (16)
  ['sickle', 'Foice', '🌾', 'Ferramentas', 30, { perk: 'sickle' }, ['sickle', 'iron']],
  ['shears', 'Tesoura de Tosquia', '✂️', 'Ferramentas', 26, { perk: 'shears' }, ['shears', 'iron']],
  ['skinning_knife', 'Faca de Esfolar', '🔪', 'Ferramentas', 28, { perk: 'skin' }, ['knife', 'steel']],
  ['fishing_net', 'Rede de Pesca', '🥅', 'Ferramentas', 34, { perk: 'net' }, ['net', 'fiber']],
  ['lantern', 'Lanterna', '🏮', 'Ferramentas', 30, { perk: 'lantern' }, ['lantern', 'glass']],
  ['spyglass', 'Luneta', '🔭', 'Ferramentas', 140, { perk: 'spyglass' }, ['spyglass', 'brass']],
  ['lockpick', 'Gazua', '🗝️', 'Ferramentas', 45, { perk: 'lockpick' }, ['keys', 'iron']],
  ['carpenter_hammer', 'Martelo de Carpinteiro', '🔨', 'Ferramentas', 32, { perk: 'builder' }, ['hammer', 'iron']],
  ['saw', 'Serrote', '🪚', 'Ferramentas', 30, { perk: 'saw' }, ['saw', 'steel']],
  ['tongs', 'Tenaz de Ferreiro', '🔧', 'Ferramentas', 34, { perk: 'tongs' }, ['tongs', 'iron']],
  ['pitchfork', 'Forcado', '🔱', 'Ferramentas', 22, { perk: 'pitchfork' }, ['fork', 'iron']],
  ['compass', 'Bússola', '🧭', 'Ferramentas', 90, { perk: 'compass' }, ['compass', 'brass']],
  ['torch', 'Tocha', '🔥', 'Ferramentas', 4, { perk: 'torch' }, ['torch', 'oak']],
  ['hunting_trap', 'Armadilha de Caça', '🪤', 'Ferramentas', 24, { perk: 'trap' }, ['trap', 'iron']],
  ['bellows', 'Fole', '🪗', 'Ferramentas', 36, { perk: 'bellows' }, ['sack', 'leather']],
  ['pestle', 'Pilão de Boticário', '🥣', 'Ferramentas', 28, { perk: 'pestle' }, ['pestle', 'marble']],
  // ---- armas (21)
  ['crossbow', 'Besta', '🏹', 'Armas', 150, { slot: 'weapon', dmg: 20, ranged: true, xbow: true, color: '#6a4423', len: 14 }, ['crossbow', 'iron']],
  ['heavy_crossbow', 'Besta Pesada', '🏹', 'Armas', 320, { slot: 'weapon', dmg: 30, ranged: true, xbow: true, color: '#4a3a2a', len: 16 }, ['crossbow', 'steel']],
  ['bolt', 'Virote de Besta', '➶', 'Armas', 3, { ammo: true, adm: 9, bolt: true }, ['arrows', 'iron']],
  ['dagger', 'Adaga de Aço', '🗡️', 'Armas', 60, { slot: 'weapon', dmg: 15, color: '#e8eef4', len: 12, fast: true }, ['knife', 'steel']],
  ['rapier', 'Florete', '🤺', 'Armas', 190, { slot: 'weapon', dmg: 22, color: '#e8eef4', len: 25, fast: true }, ['blade', 'steel']],
  ['longsword', 'Espada Longa', '🗡️', 'Armas', 260, { slot: 'weapon', dmg: 28, color: '#dfe6ec', len: 27 }, ['sword', 'steel']],
  ['greatsword', 'Montante', '⚔️', 'Armas', 360, { slot: 'weapon', dmg: 34, color: '#d0d8e0', len: 31 }, ['sword', 'iron']],
  ['halberd', 'Alabarda', '🔱', 'Armas', 240, { slot: 'weapon', dmg: 29, color: '#b0b6bd', len: 32 }, ['halberd', 'steel']],
  ['flail', 'Mangual', '⛓️', 'Armas', 170, { slot: 'weapon', dmg: 24, color: '#8d949c', len: 18 }, ['flail', 'iron']],
  ['warhammer', 'Martelo de Guerra', '🔨', 'Armas', 230, { slot: 'weapon', dmg: 30, color: '#9aa0a8', len: 20 }, ['hammer', 'steel']],
  ['morning_star', 'Maça-Estrela', '⭐', 'Armas', 200, { slot: 'weapon', dmg: 27, color: '#8d949c', len: 18 }, ['mace', 'iron']],
  ['scimitar', 'Cimitarra', '🗡️', 'Armas', 210, { slot: 'weapon', dmg: 25, color: '#e8eef4', len: 23 }, ['blade', 'silver']],
  ['mithril_sword', 'Espada de Mithril', '⚔️', 'Armas', 700, { slot: 'weapon', dmg: 42, color: '#b8e0f0', len: 26 }, ['sword', 'mithril']],
  ['obsidian_dagger', 'Adaga de Obsidiana', '🗡️', 'Armas', 260, { slot: 'weapon', dmg: 26, color: '#3a3048', len: 13, fast: true }, ['knife', 'obsidian']],
  ['dragon_blade', 'Lâmina do Dragão', '🔥', 'Armas', 1400, { slot: 'weapon', dmg: 52, color: '#e04a2a', len: 28 }, ['sword', 'dragonsc']],
  ['elven_bow', 'Arco Élfico', '🏹', 'Armas', 480, { slot: 'weapon', dmg: 30, ranged: true, color: '#b8e0a0', len: 17 }, ['bow', 'mithril']],
  ['apprentice_staff', 'Cajado de Aprendiz', '🪄', 'Armas', 120, { slot: 'weapon', dmg: 16, ranged: true, magic: 'arcane', color: '#6a4423', len: 24 }, ['staff', 'arcane']],
  ['fire_staff', 'Cajado de Fogo', '🔥', 'Armas', 420, { slot: 'weapon', dmg: 26, ranged: true, magic: 'fire', color: '#6a3a1a', len: 26 }, ['staff', 'fire']],
  ['frost_staff', 'Cajado de Gelo', '❄️', 'Armas', 420, { slot: 'weapon', dmg: 22, ranged: true, magic: 'frost', color: '#4a6a8a', len: 26 }, ['staff', 'frost']],
  ['storm_staff', 'Cajado da Tempestade', '⚡', 'Armas', 520, { slot: 'weapon', dmg: 24, ranged: true, magic: 'storm', color: '#4a4a7a', len: 26 }, ['staff', 'storm']],
  ['arcane_wand', 'Varinha Arcana', '✨', 'Armas', 300, { slot: 'weapon', dmg: 20, ranged: true, magic: 'arcane', fast: true, color: '#3a2a1a', len: 12 }, ['wand', 'arcane']],
  // ---- armaduras (38)
  ['wizard_hat', 'Chapéu de Mago', '🧙', 'Armaduras', 80, { slot: 'head', def: 1, magicB: 0.1, color: '#3a3a8a' }, ['hat', 'mage']],
  ['mage_robe', 'Manto de Mago', '🧥', 'Armaduras', 160, { slot: 'torso', def: 2, magicB: 0.15, color: '#3a3a8a' }, ['robe', 'mage']],
  ['mage_leggings', 'Calças de Mago', '👖', 'Armaduras', 90, { slot: 'legs', def: 1, magicB: 0.08, color: '#2a2a6a' }, ['pants', 'mage']],
  ['mage_slippers', 'Sapatilhas de Mago', '🥿', 'Armaduras', 60, { slot: 'feet', def: 1, magicB: 0.07, color: '#4a4aa0' }, ['boots', 'mage']],
  ['ranger_hood', 'Capuz de Patrulheiro', '🧢', 'Armaduras', 70, { slot: 'head', def: 2, rangedB: 0.08, color: '#4a6a3a' }, ['hood', 'ranger']],
  ['ranger_coat', 'Casaco de Patrulheiro', '🧥', 'Armaduras', 140, { slot: 'torso', def: 4, rangedB: 0.12, color: '#4a6a3a' }, ['cloak', 'ranger']],
  ['ranger_pants', 'Calças de Patrulheiro', '👖', 'Armaduras', 80, { slot: 'legs', def: 2, rangedB: 0.06, color: '#3a4a2a' }, ['pants', 'ranger']],
  ['ranger_boots', 'Botas de Patrulheiro', '🥾', 'Armaduras', 70, { slot: 'feet', def: 2, rangedB: 0.04, speedB: 0.04, color: '#4a3a24' }, ['boots', 'ranger']],
  ['padded_cap', 'Gorro Acolchoado', '🧢', 'Armaduras', 28, { slot: 'head', def: 1, color: '#c8b890' }, ['hood', 'padded']],
  ['gambeson', 'Gambesão', '🦺', 'Armaduras', 60, { slot: 'torso', def: 3, color: '#c8b890' }, ['tunic', 'padded']],
  ['padded_pants', 'Calções Acolchoados', '👖', 'Armaduras', 34, { slot: 'legs', def: 2, color: '#b8a880' }, ['pants', 'padded']],
  ['scale_helm', 'Elmo de Escamas', '🪖', 'Armaduras', 110, { slot: 'head', def: 3, color: '#7a8a6a' }, ['helm', 'scalec']],
  ['scale_armor', 'Armadura de Escamas', '🛡️', 'Armaduras', 220, { slot: 'torso', def: 7, color: '#7a8a6a' }, ['mail', 'scalec']],
  ['scale_greaves', 'Grevas de Escamas', '👖', 'Armaduras', 150, { slot: 'legs', def: 4, color: '#6a7a5a' }, ['greaves', 'scalec']],
  ['scale_boots', 'Botas de Escamas', '👢', 'Armaduras', 100, { slot: 'feet', def: 3, color: '#5a6a4a' }, ['iboots', 'scalec']],
  ['silver_helm', 'Elmo de Prata', '🪖', 'Armaduras', 260, { slot: 'head', def: 4, holyB: 0.1, color: '#e8eef5' }, ['helm', 'silver']],
  ['silver_cuirass', 'Couraça de Prata', '🛡️', 'Armaduras', 480, { slot: 'torso', def: 8, holyB: 0.15, color: '#e8eef5' }, ['cuirass', 'silver']],
  ['silver_greaves', 'Grevas de Prata', '👖', 'Armaduras', 320, { slot: 'legs', def: 5, holyB: 0.08, color: '#d8e0e8' }, ['greaves', 'silver']],
  ['silver_boots', 'Botas de Prata', '👢', 'Armaduras', 220, { slot: 'feet', def: 3, holyB: 0.07, color: '#c8d0d8' }, ['iboots', 'silver']],
  ['mithril_helm', 'Elmo de Mithril', '🪖', 'Armaduras', 520, { slot: 'head', def: 6, color: '#b8e0f0' }, ['helm', 'mithril']],
  ['mithril_mail', 'Cota de Mithril', '🛡️', 'Armaduras', 980, { slot: 'torso', def: 11, color: '#b8e0f0' }, ['mail', 'mithril']],
  ['mithril_greaves', 'Grevas de Mithril', '👖', 'Armaduras', 640, { slot: 'legs', def: 7, color: '#a8d0e0' }, ['greaves', 'mithril']],
  ['mithril_boots', 'Botas de Mithril', '👢', 'Armaduras', 440, { slot: 'feet', def: 5, speedB: 0.05, color: '#98c0d0' }, ['iboots', 'mithril']],
  ['noble_hat', 'Chapéu de Nobre', '🎩', 'Armaduras', 120, { slot: 'head', def: 1, charm: 1, color: '#6a2a5a' }, ['hat', 'noble']],
  ['noble_doublet', 'Gibão de Nobre', '🥻', 'Armaduras', 260, { slot: 'torso', def: 2, charm: 2, color: '#6a2a5a' }, ['tunic', 'noble']],
  ['noble_hose', 'Calças de Nobre', '👖', 'Armaduras', 130, { slot: 'legs', def: 1, charm: 1, color: '#3a1030' }, ['pants', 'noble']],
  ['noble_shoes', 'Sapatos de Fivela', '👞', 'Armaduras', 110, { slot: 'feet', def: 1, charm: 1, color: '#2a1a14' }, ['boots', 'black']],
  ['dragon_helm', 'Elmo de Dragão', '🐉', 'Armaduras', 700, { slot: 'head', def: 8, color: '#b0302a' }, ['helm', 'dragonsc']],
  ['dragon_greaves', 'Grevas de Dragão', '👖', 'Armaduras', 760, { slot: 'legs', def: 9, color: '#a02a24' }, ['greaves', 'dragonsc']],
  ['dragon_boots', 'Botas de Dragão', '👢', 'Armaduras', 560, { slot: 'feet', def: 6, color: '#902420' }, ['iboots', 'dragonsc']],
  ['brigandine', 'Brigantina', '🦺', 'Armaduras', 210, { slot: 'torso', def: 6, color: '#7a2a2a' }, ['cuirass', 'red']],
  ['great_helm', 'Elmo de Cavaleiro', '🪖', 'Armaduras', 230, { slot: 'head', def: 5, color: '#b9bec3' }, ['helm', 'steel']],
  ['buckler', 'Broquel', '🛡️', 'Armaduras', 45, { slot: 'shield', def: 1, block: 0.5, color: '#9aa0a8' }, ['shield', 'iron']],
  ['bronze_shield', 'Escudo de Bronze', '🛡️', 'Armaduras', 70, { slot: 'shield', def: 2, block: 0.56, color: '#c08040' }, ['shield', 'bronze']],
  ['kite_shield', 'Escudo de Cavaleiro', '🛡️', 'Armaduras', 260, { slot: 'shield', def: 4, block: 0.8, color: '#8e1f2a' }, ['shield', 'steel']],
  ['tower_shield', 'Pavês', '🛡️', 'Armaduras', 300, { slot: 'shield', def: 5, block: 0.86, color: '#6a5a40' }, ['shield', 'oak']],
  ['mithril_shield', 'Escudo de Mithril', '🛡️', 'Armaduras', 640, { slot: 'shield', def: 6, block: 0.88, color: '#b8e0f0' }, ['shield', 'mithril']],
  ['dragon_shield', 'Escudo de Dragão', '🛡️', 'Armaduras', 820, { slot: 'shield', def: 7, block: 0.9, color: '#b0302a' }, ['shield', 'dragonsc']],
  // ---- comida, bebida e poções (52)
  ['pumpkin', 'Abóbora', '🎃', 'Comida', 4, { food: 14, heal: 3 }, ['fruit', 'pumpkin']],
  ['onion', 'Cebola', '🧅', 'Comida', 2, { food: 5, heal: 1 }, ['fruit', 'onion']],
  ['turnip', 'Nabo', '🥔', 'Comida', 2, { food: 8, heal: 2 }, ['carrot', 'turnip']],
  ['beans', 'Feijão', '🫘', 'Comida', 3, { food: 9, heal: 2 }, ['seeds', 'bean']],
  ['garlic', 'Alho', '🧄', 'Comida', 3, { food: 3, heal: 4 }, ['fruit', 'white']],
  ['peas', 'Ervilhas', '🫛', 'Comida', 3, { food: 7, heal: 2 }, ['berries', 'pea']],
  ['goat_milk', 'Leite de Cabra', '🥛', 'Comida', 5, { food: 9, heal: 4 }, ['jug', 'milk']],
  ['duck_egg', 'Ovo de Pata', '🥚', 'Comida', 4, { food: 8, heal: 2 }, ['egg', 'egg']],
  ['duck_meat', 'Carne de Pato', '🍗', 'Comida', 7, { food: 12, heal: 0 }, ['meat', 'rawmeat']],
  ['rabbit_meat', 'Carne de Coelho', '🍖', 'Comida', 4, { food: 9, heal: 0 }, ['meat', 'rawmeat']],
  ['venison', 'Carne de Cervo', '🥩', 'Comida', 8, { food: 14, heal: 0 }, ['meat', 'rawmeat']],
  ['truffle', 'Trufa', '🍄', 'Comida', 55, { food: 6, heal: 6 }, ['mush', 'bark']],
  ['mussels', 'Mexilhões', '🦪', 'Comida', 6, { food: 8, heal: 1 }, ['scale', 'black']],
  ['pumpkin_soup', 'Sopa de Abóbora', '🥣', 'Comida', 18, { food: 38, heal: 16, buff: 'def' }, ['bowl', 'pumpkin']],
  ['onion_soup', 'Sopa de Cebola', '🥣', 'Comida', 14, { food: 30, heal: 14 }, ['bowl', 'onion']],
  ['roast_duck', 'Pato Assado', '🍗', 'Comida', 30, { food: 48, heal: 22, buff: 'str' }, ['meat', 'cooked']],
  ['rabbit_stew', 'Ensopado de Coelho', '🍲', 'Comida', 26, { food: 50, heal: 24, buff: 'vigor' }, ['bowl', 'cooked']],
  ['venison_steak', 'Bife de Cervo', '🥩', 'Comida', 28, { food: 46, heal: 26, buff: 'str' }, ['meat', 'cooked']],
  ['bean_stew', 'Feijoada Medieval', '🍲', 'Comida', 24, { food: 58, heal: 20, buff: 'regen' }, ['bowl', 'bean']],
  ['pea_soup', 'Sopa de Ervilhas', '🥣', 'Comida', 15, { food: 34, heal: 14 }, ['bowl', 'pea']],
  ['garlic_bread', 'Pão de Alho', '🥖', 'Comida', 12, { food: 32, heal: 14 }, ['bread', 'bread']],
  ['turnip_mash', 'Purê de Nabo', '🥣', 'Comida', 10, { food: 26, heal: 10 }, ['bowl', 'turnip']],
  ['goat_cheese', 'Queijo de Cabra', '🧀', 'Comida', 16, { food: 22, heal: 8 }, ['cheese', 'white']],
  ['olive_bread', 'Pão de Azeitona', '🍞', 'Comida', 14, { food: 34, heal: 12 }, ['bread', 'olive']],
  ['fish_pie', 'Torta de Peixe', '🥧', 'Comida', 28, { food: 52, heal: 22, buff: 'wisdom' }, ['pie', 'trout']],
  ['shepherd_pie', 'Torta do Pastor', '🥧', 'Comida', 32, { food: 62, heal: 26, buff: 'regen' }, ['pie', 'cooked']],
  ['ham', 'Presunto', '🍖', 'Comida', 24, { food: 36, heal: 12 }, ['meat', 'red']],
  ['bacon', 'Toucinho Defumado', '🥓', 'Comida', 14, { food: 24, heal: 8 }, ['sausage', 'rawmeat']],
  ['porridge', 'Mingau de Cevada', '🥣', 'Comida', 9, { food: 30, heal: 8, buff: 'vigor' }, ['bowl', 'barley']],
  ['pancakes', 'Panquecas com Mel', '🥞', 'Comida', 16, { food: 34, heal: 12 }, ['cake', 'honey']],
  ['fruit_tart', 'Torta de Frutas', '🥧', 'Comida', 22, { food: 40, heal: 18, buff: 'charm' }, ['pie', 'red']],
  ['jam', 'Geleia de Frutas', '🫙', 'Comida', 14, { food: 16, heal: 8 }, ['jar', 'red']],
  ['grilled_trout', 'Truta Grelhada', '🐟', 'Comida', 16, { food: 34, heal: 18 }, ['fish', 'cooked']],
  ['seafood_stew', 'Caldeirada do Mar', '🍲', 'Comida', 34, { food: 56, heal: 30, buff: 'def' }, ['bowl', 'shell']],
  ['truffle_omelette', 'Omelete de Trufas', '🍳', 'Comida', 80, { food: 40, heal: 40, buff: 'wisdom' }, ['omelette', 'egg']],
  ['nut_bread', 'Pão de Bolota', '🍞', 'Comida', 8, { food: 26, heal: 8 }, ['bread', 'bark']],
  ['candied_apple', 'Maçã do Amor', '🍎', 'Comida', 9, { food: 14, heal: 6, buff: 'charm' }, ['fruit', 'red']],
  ['grape_juice', 'Suco de Uva', '🧃', 'Comida', 8, { food: 6, heal: 6 }, ['mug', 'wine']],
  ['hop_ale', 'Cerveja de Lúpulo', '🍺', 'Comida', 20, { food: 6, heal: 6, buff: 'courage' }, ['mug', 'beer']],
  ['mulled_wine', 'Vinho Quente com Especiarias', '🍷', 'Comida', 36, { food: 6, heal: 16, buff: 'charm' }, ['mug', 'wine']],
  ['brandy', 'Aguardente', '🥃', 'Comida', 48, { food: 2, heal: 10, buff: 'courage' }, ['bottle', 'cooked']],
  ['goat_yogurt', 'Iogurte de Cabra', '🥛', 'Comida', 10, { food: 14, heal: 8 }, ['jar', 'milk']],
  ['spiced_mead', 'Hidromel Temperado', '🍶', 'Comida', 34, { food: 5, heal: 26, buff: 'mead' }, ['bottle', 'mead']],
  ['greater_healing', 'Grande Poção de Cura', '🧪', 'Comida', 90, { food: 0, heal: 140 }, ['flask', 'potionr']],
  ['regen_potion', 'Poção de Regeneração', '🧪', 'Comida', 70, { food: 0, heal: 20, buff: 'regen' }, ['flask', 'potiong']],
  ['iron_skin', 'Poção Pele de Ferro', '🧪', 'Comida', 80, { food: 0, heal: 10, buff: 'def' }, ['flask', 'pewter']],
  ['giant_potion', 'Poção do Gigante', '🧪', 'Comida', 85, { food: 0, heal: 10, buff: 'str' }, ['flask', 'orange']],
  ['swift_potion', 'Poção da Ligeireza', '🧪', 'Comida', 60, { food: 0, heal: 10, buff: 'vigor' }, ['flask', 'potiony']],
  ['wisdom_potion', 'Poção da Sabedoria', '🧪', 'Comida', 75, { food: 0, heal: 10, buff: 'wisdom' }, ['flask', 'potionb']],
  ['luck_potion', 'Poção da Sorte', '🍀', 'Comida', 95, { food: 0, heal: 10, buff: 'charm' }, ['flask', 'emerald']],
  ['troll_tonic', 'Tônico de Troll', '🧪', 'Comida', 160, { food: 10, heal: 90, buff: 'regen' }, ['flask', 'troll']],
  ['dragon_elixir', 'Elixir do Dragão', '🧪', 'Comida', 600, { food: 20, heal: 999, buff: 'str' }, ['flask', 'fire']],
  ['focus_potion', 'Poção de Foco (energia)', '🧪', 'Comida', 40, { food: 0, heal: 1, stamina: 100 }, ['flask', 'arcane']],
  // ---- objetos diversos (27)
  ['scroll_fireball', 'Pergaminho de Bola de Fogo', '📜', 'Diversos', 120, { use: 'fireball' }, ['scroll', 'fire']],
  ['scroll_heal', 'Pergaminho de Cura', '📜', 'Diversos', 90, { use: 'healall' }, ['scroll', 'potiong']],
  ['scroll_recall', 'Pergaminho do Retorno', '📜', 'Diversos', 70, { use: 'recall' }, ['scroll', 'storm']],
  ['scroll_haste', 'Pergaminho da Pressa', '📜', 'Diversos', 60, { use: 'haste' }, ['scroll', 'potiony']],
  ['scroll_shield', 'Pergaminho de Proteção', '📜', 'Diversos', 80, { use: 'ward' }, ['scroll', 'potionb']],
  ['scroll_storm', 'Pergaminho do Relâmpago', '📜', 'Diversos', 140, { use: 'lightning' }, ['scroll', 'arcane']],
  ['tome', 'Tomo do Conhecimento', '📘', 'Diversos', 150, { use: 'study' }, ['book', 'mage']],
  ['lute', 'Alaúde', '🪕', 'Diversos', 90, { use: 'play' }, ['lute', 'oak']],
  ['flute', 'Flauta de Osso', '🪈', 'Diversos', 30, { use: 'play' }, ['flute', 'bone']],
  ['war_drum', 'Tambor de Guerra', '🥁', 'Diversos', 70, { use: 'drum' }, ['drum', 'red']],
  ['chess_set', 'Tabuleiro de Xadrez', '♟️', 'Diversos', 60, { gift: true }, ['frame', 'black']],
  ['perfume', 'Perfume de Lavanda', '🧴', 'Diversos', 70, { gift: true }, ['bottle', 'lavender']],
  ['pearl_necklace', 'Colar de Pérolas', '📿', 'Diversos', 240, { gift: true }, ['necklace', 'white']],
  ['silver_mirror', 'Espelho de Prata', '🪞', 'Diversos', 130, { gift: true }, ['mirror', 'silver']],
  ['stained_glass', 'Vitral', '🪟', 'Diversos', 110, { gift: true }, ['frame', 'glass']],
  ['painting', 'Pintura a Óleo', '🖼️', 'Diversos', 160, { gift: true }, ['frame', 'gold']],
  ['toy_horse', 'Cavalinho de Madeira', '🐴', 'Diversos', 18, { gift: true, child: true }, ['toy', 'oak']],
  ['rag_doll', 'Boneca de Pano', '🧸', 'Diversos', 14, { gift: true, child: true }, ['toy', 'linenc']],
  ['holy_water', 'Água Benta', '💧', 'Diversos', 35, { use: 'holy' }, ['bottle', 'holy']],
  ['incense', 'Incenso', '🕯️', 'Diversos', 12, { use: 'incense' }, ['candle', 'lavender']],
  ['relic', 'Relíquia Sagrada', '✝️', 'Diversos', 300, { use: 'relic' }, ['cross', 'gold']],
  ['rosary', 'Rosário', '📿', 'Diversos', 40, { gift: true }, ['necklace', 'oak']],
  ['lucky_charm', 'Amuleto da Sorte', '🍀', 'Diversos', 60, { lucky: true }, ['amulet', 'emerald']],
  ['war_horn', 'Corneta de Guerra', '📯', 'Diversos', 80, { use: 'horn' }, ['horn2', 'bone']],
  ['treasure_map', 'Mapa do Tesouro', '🗺️', 'Diversos', 50, { use: 'treasure' }, ['scroll', 'paper']],
  ['orb', 'Orbe de Cristal', '🔮', 'Diversos', 220, { use: 'scry' }, ['orb', 'arcane']],
];
for (const [k, name, icon, cat, price, extra, art] of EXP_ITEMS) {
  if (ITEMS[k]) continue; // nunca sobrescreve um item que já existe
  ITEMS[k] = Object.assign({ name, icon, cat, price, key: k }, extra);
  if (art) ART_ITEMS[k] = art;
}
if (typeof ART_CACHE !== 'undefined') for (const k in ART_CACHE) if (ART_CACHE[k] === null) delete ART_CACHE[k];
// ícones dos itens que chegaram sem desenho (biomas e economia)
Object.assign(ART_ITEMS, Object.fromEntries(Object.entries({
  cactus_fruit: ['fruit', 'green'], dates: ['berries', 'cooked'], salted_meat: ['meat', 'white'], sandstone: ['rock', 'sandy'], salt: ['sandpile', 'white'],
  reed: ['herbs', 'straw'], peat: ['brick', 'bark'], lichen: ['herbs', 'scalec'], reed_basket: ['pot', 'straw'], amber_amulet: ['amulet', 'amber'],
  croc_armor: ['cuirass', 'croc'], camel_cloak: ['cloak', 'camel'], flour: ['sack', 'white'], sweet_roll: ['bread', 'honey'], rye_bread: ['bread', 'cooked'],
  biscuit: ['bread', 'bread'], cider: ['mug', 'green'], dark_ale: ['mug', 'cooked'], grape: ['berries', 'wine'], salted_fish: ['fish', 'white'],
  herbal_tea: ['mug', 'herb'], antidote: ['flask', 'venom'], butter: ['cheese', 'yellow'], curd: ['bowl', 'milk'], linen_cloth: ['roll', 'linenc'],
  fish_oil: ['bottle', 'gfish'], beeswax: ['brick', 'honey'], roof_tile: ['brick', 'brickc'], cask: ['pot', 'oak'], scarf: ['roll', 'rose'],
  leather_bag: ['sack', 'leather'], saddle: ['hide', 'leather'], pearl: ['egg', 'white'], silver_brooch: ['ring', 'silver'], oil_lamp: ['lantern', 'gold'],
  glazed_vase: ['pot', 'blue'], wooden_chair: ['planks', 'oak'],
}).filter(([k]) => ITEMS[k] && !ART_ITEMS[k])));
if (typeof ART_CACHE !== 'undefined') for (const k in ART_CACHE) if (!ART_CACHE[k]) delete ART_CACHE[k];
// itens que contam como comida/metal para a escassez, e presentes
if (typeof FOOD_KEYS !== 'undefined') for (const k in ITEMS) if (ITEMS[k].cat === 'Comida') FOOD_KEYS.add(k);
if (typeof METAL_KEYS !== 'undefined') for (const k in ITEMS) if (/_bar$|_ore$/.test(k) || ['Armas', 'Armaduras'].includes(ITEMS[k].cat)) METAL_KEYS.add(k);
GIFTABLE.push(...EXP_ITEMS.filter(r => r[5].gift || ['candied_apple', 'fruit_tart', 'mulled_wine', 'brandy', 'perfume', 'jam', 'truffle', 'emerald', 'sapphire', 'ruby', 'amethyst'].includes(r[0])).map(r => r[0]).filter(k => !GIFTABLE.includes(k)));
WEIGHT_OVERRIDE.marble = 2; WEIGHT_OVERRIDE.granite = 1.5; WEIGHT_OVERRIDE.stone_block = 2; WEIGHT_OVERRIDE.marble_block = 3; WEIGHT_OVERRIDE.ice = 1;

// ------------------------------------------------------------------ lavouras novas
Object.assign(CROPS, {
  pumpkin: { name: 'Abóbora', seed: 'pumpkin_seed', item: 'pumpkin', days: 4, yield: [2, 3], color: '#e8862a' },
  onion:   { name: 'Cebola',  seed: 'onion_seed',   item: 'onion',   days: 2, yield: [3, 5], color: '#d8a8c0' },
  turnip:  { name: 'Nabo',    seed: 'turnip_seed',  item: 'turnip',  days: 2, yield: [2, 4], color: '#ece4f2' },
  beans:   { name: 'Feijão',  seed: 'bean_seed',    item: 'beans',   days: 3, yield: [3, 6], color: '#6a9a3a' },
  garlic:  { name: 'Alho',    seed: 'garlic_seed',  item: 'garlic',  days: 3, yield: [2, 4], color: '#f0ece0' },
  peas:    { name: 'Ervilha', seed: 'pea_seed',     item: 'peas',    days: 2, yield: [3, 5], color: '#7ac04a' },
});

// ------------------------------------------------------------------ estações de trabalho novas
Object.assign(STATIONS, {
  serraria:   { name: 'Serraria',               types: ['sawmill_p'] },
  fundicao:   { name: 'Fundição',               types: ['smelter'] },
  vidraria:   { name: 'Vidraria',               types: ['glassworks'] },
  ourives:    { name: 'Bancada de Ourives',     types: ['goldsmith'] },
  tinturaria: { name: 'Tinturaria',             types: ['dyeworks'] },
  lagar:      { name: 'Lagar',                  types: ['winepress'] },
  moenda:     { name: 'Moenda de Pedra',        types: ['quern'] },
  arcano:     { name: 'Torre do Mago',          types: ['mage_tower'] },
  armeiro:    { name: 'Oficina do Armeiro',     types: ['armorer_bench'] },
});

// ------------------------------------------------------------------ receitas: [saída, quantidade, custo, estação]
const EXP_RECIPES = [
  // serraria e carpintaria
  ['pitch', 2, { pinecone: 3, resin: 1 }, 'serraria'], ['paper', 4, { bark: 3, birch_sap: 1 }, 'serraria'],
  ['toy_horse', 1, { plank: 2, dye_red: 1 }, 'serraria'], ['chess_set', 1, { hardwood: 2, plank: 1, dye_red: 1 }, 'serraria'],
  ['lute', 1, { hardwood: 3, horsehair: 2, resin: 1 }, 'serraria'], ['flute', 1, { bone: 2 }, 'bancada'],
  ['pitchfork', 1, { wood: 3, iron_bar: 1 }, 'forja'], ['crossbow', 1, { hardwood: 3, iron_bar: 2, rope: 2 }, 'serraria'],
  ['heavy_crossbow', 1, { hardwood: 4, steel_bar: 3, chain_links: 1, rope: 2 }, 'serraria'],
  ['bolt', 10, { wood: 2, iron_bar: 1, feather: 1 }, 'serraria'], ['war_drum', 1, { plank: 3, leather: 2, dye_red: 1 }, 'serraria'],
  ['tower_shield', 1, { hardwood: 5, iron_bar: 2, leather: 2 }, 'serraria'],
  // fundição: ligas e metais raros
  ['brass_bar', 1, { copper_ore: 2, zinc_ore: 1, coal: 1 }, 'fundicao'], ['pewter_bar', 1, { tin_ore: 2, lead_ore: 1, coal: 1 }, 'fundicao'],
  ['electrum_bar', 1, { silver_bar: 1, gold_bar: 1, coal: 1 }, 'fundicao'], ['mithril_bar', 1, { mithril_ore: 3, coal: 3, sulfur: 1 }, 'fundicao'],
  ['chain_links', 4, { iron_bar: 1, coal: 1 }, 'fundicao'], ['quicklime', 2, { limestone: 3, coal: 1 }, 'fundicao'],
  ['bellows', 1, { leather: 3, plank: 2, brass_bar: 1 }, 'bancada'], ['tongs', 1, { iron_bar: 2 }, 'forja'],
  // vidraria
  ['glass', 2, { sand: 3, quicklime: 1, coal: 1 }, 'vidraria'], ['vial', 4, { glass: 1 }, 'vidraria'], ['lens', 1, { glass: 2, quartz: 1 }, 'vidraria'],
  ['lantern', 1, { glass: 1, iron_bar: 1, candle: 1 }, 'vidraria'], ['spyglass', 1, { lens: 2, brass_bar: 2, leather: 1 }, 'vidraria'],
  ['stained_glass', 1, { glass: 3, dye_red: 1, dye_blue: 1, lead_ore: 1 }, 'vidraria'], ['silver_mirror', 1, { glass: 2, silver_bar: 1 }, 'vidraria'],
  ['orb', 1, { glass: 3, runestone: 1, amethyst: 1 }, 'arcano'],
  // ourives
  ['pearl_necklace', 1, { pearl: 4, silver_bar: 1 }, 'ourives'], ['gold_thread', 2, { gold_bar: 1 }, 'ourives'], ['silk_thread', 2, { silk_cocoon: 3 }, 'tear'],
  ['lucky_charm', 1, { emerald: 1, silver_bar: 1, rope: 1 }, 'ourives'], ['rosary', 1, { acorn: 6, rope: 1, silver_bar: 1 }, 'ourives'],
  ['compass', 1, { brass_bar: 2, iron_bar: 1, glass: 1 }, 'ourives'], ['relic', 1, { gold_bar: 2, bone: 3, ruby: 1, holy_water: 1 }, 'ourives'],
  // tinturaria e tecidos
  ['dye_red', 2, { rose_petals: 3, quicklime: 1 }, 'tinturaria'], ['dye_blue', 2, { lavender: 3, quicklime: 1 }, 'tinturaria'],
  ['dye_yellow', 2, { sunflower: 3, quicklime: 1 }, 'tinturaria'], ['red_cloth', 1, { cloth: 2, dye_red: 1 }, 'tinturaria'],
  ['blue_cloth', 1, { cloth: 2, dye_blue: 1 }, 'tinturaria'], ['felt', 2, { wool: 3, soap: 1 }, 'tinturaria'],
  ['ink', 3, { coal: 1, birch_sap: 1, dye_blue: 1 }, 'tinturaria'], ['painting', 1, { cloth: 2, plank: 2, dye_red: 1, dye_blue: 1, dye_yellow: 1, olive_oil: 1 }, 'tinturaria'],
  ['rag_doll', 1, { cloth: 2, wool: 1, dye_red: 1 }, 'tear'],
  // lagar e moenda
  ['olive_oil', 2, { olive: 5 }, 'lagar'], ['grape_juice', 2, { grape: 4 }, 'lagar'], ['wine', 2, { grape: 6, cask: 1 }, 'lagar'],
  ['brandy', 1, { wine: 3, coal: 1 }, 'lagar'], ['mulled_wine', 2, { wine: 2, spices: 1, honey: 1 }, 'lagar'],
  ['flour', 3, { wheat: 4 }, 'moenda'], ['bone_meal', 3, { bone: 4 }, 'moenda'], ['nut_bread', 2, { acorn: 6, wheat: 1 }, 'fogueira'],
  ['soap', 3, { bear_fat: 1, quicklime: 1, lavender: 1 }, 'moenda'], ['soap', 2, { olive_oil: 1, quicklime: 1 }, 'moenda'],
  // cozinha e fogueira
  ['pumpkin_soup', 1, { pumpkin: 1, onion: 1, milk: 1 }, 'cozinha'], ['onion_soup', 1, { onion: 3, bread: 1 }, 'fogueira'],
  ['roast_duck', 1, { duck_meat: 2, garlic: 1, wood: 1 }, 'fogueira'], ['rabbit_stew', 1, { rabbit_meat: 2, carrot: 1, onion: 1 }, 'cozinha'],
  ['venison_steak', 1, { venison: 1, garlic: 1, wood: 1 }, 'fogueira'], ['bean_stew', 1, { beans: 3, bacon: 1, onion: 1 }, 'cozinha'],
  ['pea_soup', 1, { peas: 3, onion: 1 }, 'fogueira'], ['garlic_bread', 2, { flour: 2, garlic: 1, butter: 1 }, 'cozinha'],
  ['turnip_mash', 1, { turnip: 3, butter: 1 }, 'fogueira'], ['olive_bread', 2, { flour: 2, olive: 3, olive_oil: 1 }, 'cozinha'],
  ['fish_pie', 1, { fish: 2, flour: 2, egg: 1 }, 'cozinha'], ['shepherd_pie', 1, { meat: 2, turnip: 2, flour: 1, onion: 1 }, 'cozinha'],
  ['porridge', 1, { barley: 2, milk: 1 }, 'fogueira'], ['pancakes', 2, { flour: 2, egg: 2, milk: 1, honey: 1 }, 'cozinha'],
  ['fruit_tart', 1, { berries: 4, flour: 2, honey: 1 }, 'cozinha'], ['jam', 2, { berries: 5, honey: 1 }, 'cozinha'],
  ['grilled_trout', 1, { trout: 1, garlic: 1, olive_oil: 1 }, 'fogueira'], ['seafood_stew', 1, { mussels: 3, fish: 1, onion: 1, seaweed: 1 }, 'cozinha'],
  ['truffle_omelette', 1, { truffle: 1, egg: 3, butter: 1 }, 'cozinha'], ['candied_apple', 2, { apple: 2, honey: 1 }, 'fogueira'],
  ['goat_cheese', 1, { goat_milk: 4, salt: 1 }, 'cozinha'], ['goat_yogurt', 2, { goat_milk: 3 }, 'cozinha'],
  ['hop_ale', 2, { barley: 3, hops: 2 }, 'cervejaria'], ['spiced_mead', 2, { honey: 3, spices: 1 }, 'cervejaria'],
  // defumador
  ['ham', 1, { meat: 3, salt: 1 }, 'defumador'], ['bacon', 2, { meat: 2, salt: 1, wood: 1 }, 'defumador'],
  // alquimia (poções) e torre do mago (magia)
  ['greater_healing', 1, { healing_potion: 2, mandrake: 1, vial: 1 }, 'alquimia'], ['regen_potion', 1, { herb: 3, royal_jelly: 1, vial: 1 }, 'alquimia'],
  ['iron_skin', 1, { granite: 2, nettle: 3, vial: 1 }, 'alquimia'], ['giant_potion', 1, { troll_hide: 1, bear_fat: 2, vial: 1 }, 'alquimia'],
  ['swift_potion', 1, { bat_wing: 2, herb: 2, vial: 1 }, 'alquimia'], ['wisdom_potion', 1, { moonpetal: 1, lavender: 2, vial: 1 }, 'alquimia'],
  ['luck_potion', 1, { emerald: 1, moonpetal: 1, honey: 1, vial: 1 }, 'alquimia'], ['troll_tonic', 1, { troll_hide: 1, herb: 3, vial: 1 }, 'alquimia'],
  ['dragon_elixir', 1, { dragon_heart: 1, royal_jelly: 1, vial: 1 }, 'alquimia'], ['focus_potion', 1, { mandrake: 1, vial: 1, honey: 1 }, 'alquimia'],
  ['holy_water', 2, { vial: 2, incense: 1 }, 'alquimia'], ['incense', 4, { lavender: 2, resin: 1 }, 'alquimia'],
  ['scroll_fireball', 1, { paper: 2, ink: 1, sulfur: 2, runestone: 1 }, 'arcano'], ['scroll_heal', 1, { paper: 2, ink: 1, herb: 3, moonpetal: 1 }, 'arcano'],
  ['scroll_recall', 1, { paper: 2, ink: 1, quartz: 1 }, 'arcano'], ['scroll_haste', 1, { paper: 2, ink: 1, bat_wing: 1 }, 'arcano'],
  ['scroll_shield', 1, { paper: 2, ink: 1, granite: 1, quartz: 1 }, 'arcano'], ['scroll_storm', 1, { paper: 2, ink: 1, sapphire: 1, runestone: 1 }, 'arcano'],
  ['tome', 1, { paper: 8, leather: 2, ink: 2, gold_thread: 1 }, 'arcano'], ['treasure_map', 1, { paper: 1, ink: 1, ancient_coin: 1 }, 'arcano'],
  ['apprentice_staff', 1, { hardwood: 2, quartz: 1, runestone: 1 }, 'arcano'], ['arcane_wand', 1, { yew_wood: 1, amethyst: 1, runestone: 1, gold_thread: 1 }, 'arcano'],
  ['fire_staff', 1, { hardwood: 3, ruby: 1, sulfur: 3, runestone: 1 }, 'arcano'], ['frost_staff', 1, { hardwood: 3, sapphire: 1, ice: 4, runestone: 1 }, 'arcano'],
  ['storm_staff', 1, { hardwood: 3, emerald: 1, bat_wing: 3, runestone: 2 }, 'arcano'],
  ['wizard_hat', 1, { blue_cloth: 2, gold_thread: 1 }, 'arcano'], ['mage_robe', 1, { blue_cloth: 4, silk_thread: 2, runestone: 1 }, 'arcano'],
  ['mage_leggings', 1, { blue_cloth: 3, silk_thread: 1 }, 'arcano'], ['mage_slippers', 1, { felt: 2, blue_cloth: 1 }, 'arcano'],
  // ferramentas
  ['sickle', 1, { wood: 1, iron_bar: 2 }, 'forja'], ['shears', 1, { iron_bar: 2 }, 'forja'], ['skinning_knife', 1, { steel_bar: 1, bone: 1 }, 'forja'],
  ['fishing_net', 1, { rope: 6, pitch: 1 }, 'bancada'], ['lockpick', 1, { steel_bar: 1, brass_bar: 1 }, 'ourives'],
  ['carpenter_hammer', 1, { hardwood: 1, iron_bar: 2 }, 'forja'], ['saw', 1, { steel_bar: 2, plank: 1 }, 'forja'],
  ['hunting_trap', 1, { iron_bar: 2, chain_links: 1 }, 'forja'], ['pestle', 1, { marble: 2 }, 'bancada'],
  // armas e armaduras (armeiro, forja, bancada)
  ['dagger', 1, { steel_bar: 2, leather: 1 }, 'forja'], ['rapier', 1, { steel_bar: 4, brass_bar: 1 }, 'armeiro'], ['longsword', 1, { steel_bar: 6, leather: 1 }, 'armeiro'],
  ['greatsword', 1, { steel_bar: 9, leather: 2 }, 'armeiro'], ['halberd', 1, { hardwood: 3, steel_bar: 5 }, 'armeiro'], ['flail', 1, { hardwood: 1, iron_bar: 5, chain_links: 2 }, 'armeiro'],
  ['warhammer', 1, { hardwood: 2, steel_bar: 6 }, 'armeiro'], ['morning_star', 1, { hardwood: 2, iron_bar: 7 }, 'armeiro'], ['scimitar', 1, { steel_bar: 5, silver_bar: 1 }, 'armeiro'],
  ['mithril_sword', 1, { mithril_bar: 4, gold_thread: 1, leather: 1 }, 'armeiro'], ['obsidian_dagger', 1, { obsidian: 2, hardwood: 1 }, 'armeiro'],
  ['dragon_blade', 1, { dragon_scale: 4, mithril_bar: 2, dragon_heart: 1 }, 'armeiro'], ['elven_bow', 1, { yew_wood: 4, silk_thread: 2, mithril_bar: 1 }, 'armeiro'],
  ['padded_cap', 1, { cloth: 2, wool: 1 }, 'bancada'], ['gambeson', 1, { cloth: 5, wool: 2 }, 'bancada'], ['padded_pants', 1, { cloth: 3, wool: 1 }, 'bancada'],
  ['ranger_hood', 1, { leather: 2, dye_yellow: 1, cloth: 1 }, 'bancada'], ['ranger_coat', 1, { hard_leather: 3, cloth: 2, dye_yellow: 1 }, 'bancada'],
  ['ranger_pants', 1, { leather: 3, cloth: 1 }, 'bancada'], ['ranger_boots', 1, { hard_leather: 2, felt: 1 }, 'bancada'],
  ['scale_helm', 1, { iron_bar: 3, leather: 1 }, 'armeiro'], ['scale_armor', 1, { iron_bar: 7, chain_links: 2, leather: 2 }, 'armeiro'],
  ['scale_greaves', 1, { iron_bar: 5, leather: 1 }, 'armeiro'], ['scale_boots', 1, { iron_bar: 3, leather: 2 }, 'armeiro'],
  ['silver_helm', 1, { silver_bar: 3, steel_bar: 1 }, 'armeiro'], ['silver_cuirass', 1, { silver_bar: 6, steel_bar: 2, leather: 2 }, 'armeiro'],
  ['silver_greaves', 1, { silver_bar: 4, steel_bar: 1 }, 'armeiro'], ['silver_boots', 1, { silver_bar: 3, leather: 1 }, 'armeiro'],
  ['mithril_helm', 1, { mithril_bar: 3 }, 'armeiro'], ['mithril_mail', 1, { mithril_bar: 6, chain_links: 2 }, 'armeiro'],
  ['mithril_greaves', 1, { mithril_bar: 4 }, 'armeiro'], ['mithril_boots', 1, { mithril_bar: 3, leather: 1 }, 'armeiro'],
  ['noble_hat', 1, { felt: 2, feather: 2, gold_thread: 1 }, 'tear'], ['noble_doublet', 1, { red_cloth: 3, gold_thread: 1, silk_thread: 1 }, 'tear'],
  ['noble_hose', 1, { blue_cloth: 2, silk_thread: 1 }, 'tear'], ['noble_shoes', 1, { hard_leather: 2, brass_bar: 1 }, 'curtidor'],
  ['dragon_helm', 1, { dragon_scale: 3, steel_bar: 2 }, 'armeiro'], ['dragon_greaves', 1, { dragon_scale: 4, steel_bar: 2 }, 'armeiro'],
  ['dragon_boots', 1, { dragon_scale: 3, hard_leather: 2 }, 'armeiro'], ['brigandine', 1, { red_cloth: 2, steel_bar: 3, leather: 2 }, 'armeiro'],
  ['great_helm', 1, { steel_bar: 5 }, 'armeiro'], ['buckler', 1, { iron_bar: 2 }, 'forja'], ['bronze_shield', 1, { bronze_bar: 4, wood: 2 }, 'forja'],
  ['kite_shield', 1, { steel_bar: 4, hardwood: 2, dye_red: 1 }, 'armeiro'], ['mithril_shield', 1, { mithril_bar: 4, hardwood: 1 }, 'armeiro'],
  ['dragon_shield', 1, { dragon_scale: 5, steel_bar: 2 }, 'armeiro'],
  // pedreiro e o resto
  ['stone_block', 2, { stone: 4 }, 'bancada'], ['stone_block', 3, { granite: 2 }, 'bancada'], ['marble_block', 1, { marble: 2 }, 'bancada'],
  ['perfume', 1, { lavender: 4, rose_petals: 2, vial: 1 }, 'alquimia'],
  ['war_horn', 1, { goat_horn: 1, brass_bar: 1 }, 'ourives'],
  // usos a mais: sílex, salitre, presas, veneno, pó de sepultura, conchas, cerdas e as ligas
  ['arrow', 8, { wood: 1, flint: 1, feather: 1 }, null], ['torch', 4, { wood: 2, flint: 1, resin: 1 }, null],
  ['ham', 2, { meat: 4, saltpeter: 1 }, 'defumador'], ['scroll_fireball', 1, { paper: 2, ink: 1, saltpeter: 2, sulfur: 1, runestone: 1 }, 'arcano'],
  ['lucky_charm', 1, { wolf_fang: 3, rope: 1, silver_bar: 1 }, 'ourives'], ['antidote', 2, { venom_gland: 1, herb: 2, vial: 1 }, 'alquimia'],
  ['scroll_recall', 1, { paper: 2, ink: 1, grave_dust: 2 }, 'arcano'], ['quicklime', 2, { seashell: 4, coal: 1 }, 'fundicao'],
  ['pearl_necklace', 1, { seashell: 6, pearl: 2, silver_bar: 1 }, 'ourives'], ['painting', 1, { cloth: 2, plank: 2, boar_bristle: 2, dye_red: 1, dye_blue: 1, dye_yellow: 1 }, 'tinturaria'],
  ['oil_lamp', 2, { pewter_bar: 1, olive_oil: 1 }, 'fundicao'], ['chess_set', 1, { hardwood: 2, pewter_bar: 2 }, 'serraria'],
  ['orb', 1, { glass: 3, runestone: 1, electrum_bar: 1 }, 'arcano'], ['arcane_wand', 1, { yew_wood: 1, amethyst: 1, electrum_bar: 1 }, 'arcano'],
  ['regen_potion', 1, { bone_meal: 2, herb: 3, royal_jelly: 1, vial: 1 }, 'alquimia'],
];
for (const [out, n, cost, station] of EXP_RECIPES) if (ITEMS[out] && Object.keys(cost).every(k => ITEMS[k] || ITEM_GROUPS[k])) RECIPES.push({ out, n, cost, station: STATIONS[station] ? station : (station ? 'bancada' : null) });

// ------------------------------------------------------------------ de onde vêm as matérias-primas no mundo
// a mais do que o nó já dá: [chance, mín, máx]
const NODE_EXTRA = {
  1: { bark: [0.6, 1, 2], acorn: [0.5, 1, 3], truffle: [0.04, 1, 1] }, 2: { pinecone: [0.7, 1, 3], bark: [0.3, 1, 1] },
  3: { flint: [0.35, 1, 2], limestone: [0.35, 1, 2], granite: [0.25, 1, 2], marble: [0.06, 1, 1] },
  4: { lead_ore: [0.3, 1, 2], obsidian: [0.03, 1, 1] }, 5: { sapphire: [0.08, 1, 1], mithril_ore: [0.06, 1, 1] },
  6: { rose_petals: [0.3, 1, 2] }, 7: { birch_sap: [0.6, 1, 2], bark: [0.4, 1, 2] }, 8: { bark: [0.3, 1, 1] },
  10: { bark: [0.6, 2, 3], acorn: [0.6, 2, 4], truffle: [0.12, 1, 1] }, 12: { sulfur: [0.4, 1, 2], saltpeter: [0.25, 1, 1] },
  13: { zinc_ore: [0.4, 1, 2] }, 14: { quartz: [0.2, 1, 1] }, 15: { quartz: [0.25, 1, 1], mithril_ore: [0.08, 1, 1], amethyst: [0.08, 1, 1] },
  16: { amethyst: [0.4, 1, 1], emerald: [0.25, 1, 1], sapphire: [0.2, 1, 1], ruby: [0.2, 1, 1], runestone: [0.15, 1, 1] },
  17: { limestone: [0.3, 1, 1] }, 19: { lavender: [0.35, 1, 2], nettle: [0.4, 1, 2], mandrake: [0.05, 1, 1], moonpetal: [0.04, 1, 1] },
  22: { quartz: [0.06, 1, 1] }, 24: { birch_sap: [0.2, 1, 1], bark: [0.3, 1, 1] },
};
// e os animais e monstros
const CREATURE_EXTRA = {
  wolf: { wolf_fang: [1, 2] }, spider: { venom_gland: [0, 1] }, bat: { bat_wing: [1, 2] }, skeleton: { grave_dust: [1, 2] },
  troll: { troll_hide: [1, 2] }, dragon: { dragon_heart: [1, 1] }, bear: { bear_fat: [1, 2] }, deer: { venison: [1, 2] },
  boar: { boar_bristle: [1, 2] }, rabbit: { rabbit_meat: [1, 1] }, skel_king: { grave_dust: [3, 5], runestone: [1, 1] },
  spider_queen: { venom_gland: [3, 5] }, goat: { goat_milk: [0, 1] },
};
for (const k in CREATURE_EXTRA) if (CREATURES[k]) CREATURES[k].drops = Object.assign({}, CREATURES[k].drops || {}, CREATURE_EXTRA[k]);

// ------------------------------------------------------------------ cada loja com a mercadoria nova
const EXP_SELLS = {
  store: ['torch', 'soap', 'flute', 'pumpkin_seed', 'onion_seed', 'turnip_seed', 'bean_seed', 'garlic_seed', 'pea_seed', 'onion', 'garlic', 'beans', 'jam', 'candied_apple', 'lantern', 'toy_horse', 'rag_doll'],
  lumber: ['bark', 'acorn', 'pinecone', 'birch_sap', 'pitch', 'saw', 'carpenter_hammer'],
  quarry: ['flint', 'limestone', 'granite', 'marble', 'stone_block', 'quicklime'],
  smith: ['sickle', 'shears', 'tongs', 'pitchfork', 'hunting_trap', 'skinning_knife', 'dagger', 'buckler', 'bronze_shield', 'chain_links', 'bellows', 'padded_cap', 'gambeson'],
  hunter: ['ranger_hood', 'ranger_coat', 'ranger_pants', 'truffle', 'wolf_fang', 'bear_fat', 'venison', 'rabbit_meat', 'boar_bristle', 'hunting_trap', 'skinning_knife', 'bolt', 'crossbow'],
  mine: ['sulfur', 'saltpeter', 'zinc_ore', 'lead_ore', 'quartz', 'obsidian', 'mithril_ore'],
  bakery: ['garlic_bread', 'olive_bread', 'nut_bread', 'pancakes', 'fruit_tart'],
  mill: ['bone_meal', 'pumpkin_seed', 'bean_seed', 'pea_seed'],
  inn: ['hop_ale', 'mulled_wine', 'spiced_mead', 'roast_duck', 'bean_stew', 'onion_soup', 'shepherd_pie', 'pumpkin_soup', 'rabbit_stew', 'venison_steak', 'pea_soup', 'porridge', 'turnip_mash', 'lute'],
  weaver: ['silk_cocoon', 'felt', 'silk_thread', 'red_cloth', 'blue_cloth', 'padded_pants', 'gambeson', 'rag_doll'],
  brewer: ['hops', 'hop_ale', 'spiced_mead', 'brandy'],
  trade: ['olive_oil', 'perfume', 'pearl_necklace', 'stained_glass', 'compass', 'spyglass', 'dye_blue', 'brass_bar'],
  stable: ['horsehair', 'pitchfork'],
  granary: ['pumpkin', 'onion', 'turnip', 'beans', 'garlic', 'peas', 'pumpkin_seed', 'onion_seed', 'turnip_seed', 'bean_seed', 'garlic_seed', 'pea_seed', 'sunflower', 'hops'],
  clinic: ['nettle', 'lavender', 'greater_healing', 'regen_potion', 'holy_water'],
  apothecary: ['giant_potion', 'luck_potion', 'bat_wing', 'venom_gland', 'grave_dust', 'lavender', 'nettle', 'mandrake', 'royal_jelly', 'vial', 'greater_healing', 'regen_potion', 'iron_skin', 'swift_potion', 'wisdom_potion', 'focus_potion', 'pestle', 'incense'],
  fishery: ['ice', 'mussels', 'seashell', 'seaweed', 'grilled_trout', 'fish_pie', 'seafood_stew', 'fishing_net'],
  winery: ['grape_juice', 'mulled_wine', 'brandy'],
  ranch: ['goat_milk', 'duck_egg', 'duck_meat', 'rabbit_meat', 'ham', 'bacon', 'shears', 'horsehair'],
  jeweler: ['quartz', 'amethyst', 'emerald', 'sapphire', 'ruby', 'pearl_necklace', 'lucky_charm', 'gold_thread', 'electrum_bar', 'rosary'],
  dairy: ['goat_milk', 'goat_cheese', 'goat_yogurt'],
  chandler: ['incense', 'lantern', 'torch', 'soap'],
  pottery: ['glass', 'vial', 'quicklime'],
  carpentry: ['toy_horse', 'chess_set', 'war_drum', 'pitch'],
  bank: ['electrum_bar', 'treasure_map'],
  smokery: ['ham', 'bacon'], tannery: ['noble_shoes', 'ranger_boots', 'boar_bristle'],
  sawmill: ['bark', 'pitch', 'saw'], cellarshop: ['ice', 'brandy', 'mulled_wine'], tower: ['spyglass', 'compass', 'bolt'],
  school: ['paper', 'ink', 'tome'], bath: ['soap', 'perfume'],
};
for (const [k, list] of Object.entries(EXP_SELLS)) if (SHOPS[k]) { SHOPS[k].sells = SHOPS[k].sells || []; for (const it of list) if (ITEMS[it] && !SHOPS[k].sells.includes(it)) SHOPS[k].sells.push(it); }

// ------------------------------------------------------------------ o que cada ferramenta faz (na mochila ou na mão)
const Expansion = {
  has(k) { return Inv.count(k) > 0 || Object.values(P.equip || {}).includes(k); },
  // bônus do que está vestido: magia, arco, carisma, prata contra mortos-vivos, ligeireza
  worn(key) { let n = 0; for (const s of ARMOR_SLOTS) { const it = P.equip[s] && ITEMS[P.equip[s]]; if (it && it[key]) n += it[key]; } return n; },
  luck() { return this.has('lucky_charm') ? 1 : 0; },
  // ---- itens que se usam (pergaminhos, instrumentos, água benta...)
  use(k) {
    const it = ITEMS[k]; if (!it || !it.use || Inv.count(k) <= 0) return;
    const foes = r => G.ents.filter(e => !e.dead && e.dmg > 0 && canHit(e) && U.dist(e.x, e.y, P.x, P.y) < r * TILE);
    const spend = () => Inv.add(k, -1);
    switch (it.use) {
      case 'fireball': { const L = foes(6); if (!L.length) { UI.msg('Nenhum inimigo por perto para a bola de fogo.'); return; } spend(); for (const e of L) { Game.damage(e, 70 + P.level * 3, P); Game.burst(e.x, e.y - 14, '#ff6a1a', 14); } Sound.play('mine'); UI.msg(`🔥 A bola de fogo atinge ${L.length} ${L.length === 1 ? 'inimigo' : 'inimigos'}!`, 'gold'); break; }
      case 'lightning': { const L = foes(9).slice(0, 4); if (!L.length) { UI.msg('Nenhum inimigo por perto para o relâmpago.'); return; } spend(); for (const e of L) { Game.damage(e, 95 + P.level * 3, P); Game.burst(e.x, e.y - 20, '#c8c0ff', 16); } UI.msg(`⚡ O relâmpago salta entre ${L.length} inimigos!`, 'gold'); break; }
      case 'healall': spend(); P.hp = P.maxHp; for (const a of Game.allies()) a.hp = a.maxHp; UI.msg('✨ Uma luz suave cura você e os seus companheiros.', 'gold'); break;
      case 'recall': { const home = World.structs.find(s => s.owner === 'player' && !s.removed && (['cabin', 'house', 'manor'].includes(s.type) || (BUILDINGS[s.type] && BUILDINGS[s.type].home))); if (!home || G.place || G.dungeon) { UI.msg(G.place || G.dungeon ? 'A magia não funciona aqui dentro.' : 'Você não tem uma casa para voltar.', 'bad'); return; } spend(); P.x = (home.x + home.w / 2) * TILE; P.y = (home.y + home.h + 0.8) * TILE; P.mounted = false; P.sailing = false; UI.msg('🌀 Num piscar de olhos, você está em casa.', 'gold'); break; }
      case 'haste': spend(); Farm.addBuff('vigor'); P.stamina = Game.maxSt(); UI.msg('💨 Seus passos ficam leves: energia cheia e vigor.', 'gold'); break;
      case 'ward': spend(); Farm.addBuff('def'); UI.msg('🛡️ Uma aura de proteção envolve você.', 'gold'); break;
      case 'study': spend(); Game.gainXp(150 + P.level * 10); Farm.addBuff('wisdom'); UI.msg('📘 Você estuda o tomo a noite inteira: muita experiência!', 'gold'); break;
      case 'play': this.play(k); break;
      case 'drum': Farm.addBuff('courage'); for (const a of Game.allies()) a.hp = Math.min(a.maxHp, a.hp + 20); UI.msg('🥁 O tambor ressoa: coragem para você e os seus.', 'gold'); break;
      case 'horn': Farm.addBuff('courage'); for (const a of Game.allies()) a.dmg = (a.dmgBase || (a.dmgBase = a.dmg)) * 1.2; UI.msg('📯 O toque da corneta incendeia os seus soldados (+20% de dano).', 'gold'); break;
      case 'holy': { spend(); Farm.addBuff('holy'); const L = G.ents.filter(e => !e.dead && ['skeleton', 'skel_king'].includes(e.kind) && U.dist(e.x, e.y, P.x, P.y) < 6 * TILE); for (const e of L) Game.damage(e, 120, P); G.piety = (G.piety || 0) + 2; UI.msg(L.length ? `💧 A água benta queima ${L.length} mortos-vivos!` : '💧 Você se benze com a água benta (+2 de fé).', 'gold'); break; }
      case 'incense': spend(); G.piety = (G.piety || 0) + 3; Farm.addBuff('blessed'); UI.msg('🕯️ O incenso perfuma o ar: +3 de fé e bênção.', 'gold'); break;
      case 'relic': spend(); G.piety = (G.piety || 0) + 25; Court.addFame(10); UI.msg('✝️ Você doou a relíquia à Igreja: +25 de fé e +10 de fama.', 'gold'); break;
      case 'treasure': { spend(); const g = U.rint(80, 260) * (1 + this.luck()); P.gold += g; const extra = U.pick(['gem', 'ancient_coin', 'ruby', 'emerald', 'pearl']); Inv.add(extra, 1); Sound.play('coin'); UI.msg(`🗺️ Você seguiu o mapa e desenterrou ${g} 🪙 e ${ITEMS[extra].name}!`, 'gold'); break; }
      case 'scry': { const camps = World.camps.filter(c => !c.cleared).length; const w = Diplo.D().wars.map(x => `${CIV_DEFS[x.a].short} × ${CIV_DEFS[x.b].short}`); UI.msg(`🔮 O orbe revela: ${camps} acampamentos de bandidos ativos; ${w.length ? 'guerras: ' + w.join(', ') : 'nenhuma guerra'}; ${World.villages.length} vilas no mundo.`, 'gold', true); break; }
    }
  },
  play(k) {
    if ((G.playDay || -1) === G.day) { UI.msg('🎶 Você já tocou este mês. Os dedos precisam descansar.'); return; }
    G.playDay = G.day;
    const tav = World.structs.find(s => s.type === 'tavern' && !s.removed && U.dist((s.x + s.w / 2) * TILE, (s.y + s.h / 2) * TILE, P.x, P.y) < 8 * TILE) || (G.place && /tavern|inn/.test(G.place.lay || G.place.name || ''));
    const g = (tav ? U.rint(20, 60) : U.rint(2, 10)) + (k === 'lute' ? 15 : 0) + this.worn('charm') * 4;
    P.gold += g; Court.addFame(tav ? 2 : 0); Farm.addBuff('charm');
    UI.msg(tav ? `🎶 A taverna inteira canta junto! Você ganhou ${g} 🪙 e +2 de fama.` : `🎶 Você toca à beira da estrada e ganha ${g} 🪙 de quem passa.`, 'gold');
  },
};

// ------------------------------------------------------------------ ganchos no jogo
{
  // nós do mapa dão matérias-primas a mais (e a foice, o serrote e a picareta boa ajudam)
  const g0 = Game.gather.bind(Game);
  Game.gather = function (i) {
    const type = World.obj[i];
    const r = g0(i);
    if (type && World.obj[i] !== type) { // o nó foi colhido agora
      const ex = NODE_EXTRA[type]; if (ex) {
        const px = (i % WORLD_W + 0.5) * TILE, py = ((i / WORLD_W) | 0) * TILE; let k = 0;
        for (const it in ex) { const [c, a, b] = ex[it]; if (ITEMS[it] && Math.random() < c * (1 + Expansion.luck() * 0.5)) { const n = U.rint(a, b); Inv.add(it, n); Game.addText(px, py - 40 - k * 14, `+${n} ${ITEMS[it].name}`, '#c8f0ff'); k++; } }
      }
      if (type === 6 && Expansion.has('sickle')) Inv.add('berries', 1);
    }
    return r;
  };
  // foice: colheita maior; adubo (farinha de osso) na mochila: +1 também
  const h0 = Farm.harvest.bind(Farm);
  Farm.harvest = function (i) {
    const p = this.plots()[i], c = p && CROPS[p.crop];
    const r = h0(i);
    if (r && c) { let n = (Expansion.has('sickle') ? 1 : 0); if (Inv.count('bone_meal') > 0 && Math.random() < 0.5) { Inv.add('bone_meal', -1); n++; } if (n) Inv.add(c.item, n); }
    return r;
  };
  // faca de esfolar: couro e pele a mais dos animais
  const k0 = Game.kill.bind(Game);
  Game.kill = function (e, src) {
    const r = k0(e, src);
    if (src === P && e.def && e.def.drops && Expansion.has('skinning_knife')) {
      const hide = ['leather', 'wolf_pelt', 'fox_pelt', 'bear_pelt', 'rabbit_hide'].find(h => e.def.drops[h]);
      if (hide) { Inv.add(hide, 1); Game.addText(e.x, e.y - 60, `+1 ${ITEMS[hide].name} (faca de esfolar)`, '#ffe9a8'); }
    }
    return r;
  };
  // rede de pesca: às vezes vem um peixe a mais, conchas, algas e mexilhões
  const f0 = Game.reelIn.bind(Game);
  Game.reelIn = function () {
    const ok = P.fishing && P.fishing.state === 'bite', water = P.fishing && P.fishing.water;
    const r = f0();
    if (ok) {
      if (Expansion.has('fishing_net') && Math.random() < 0.45) { const f = U.pick(water === 'river' ? ['trout', 'carp'] : ['sardine', 'cod']); Inv.add(f, 1); UI.msg(`🥅 A rede trouxe também ${ITEMS[f].name}.`); }
      if (water !== 'river' && Math.random() < 0.3) { const x = U.pick(['seashell', 'seaweed', 'mussels', 'mussels']); Inv.add(x, 1); Game.addText(P.x, P.y - 64, `+1 ${ITEMS[x].name}`, '#c8f0ff'); }
    }
    return r;
  };
  // serrote, tenaz, pilão e fole: rendem mais nas oficinas
  const c0 = Game.craft.bind(Game);
  Game.craft = function (ri, n) {
    const r = RECIPES[ri], before = Inv.count(r.out);
    // o fole economiza carvão: devolve 1 carvão por receita da forja ou da fundição que gastou carvão
    const coal = (r.station === 'forja' || r.station === 'fundicao') && r.cost.coal && Expansion.has('bellows');
    c0(ri, n);
    const made = Inv.count(r.out) - before; if (made <= 0) return;
    const times = Math.round(made / r.n);
    let bonus = 0;
    if ((r.station === 'carpintaria' || r.station === 'serraria') && Expansion.has('saw')) bonus += times;
    if ((r.station === 'forja' || r.station === 'fundicao' || r.station === 'armeiro') && Expansion.has('tongs')) for (let k = 0; k < times; k++) if (Math.random() < 0.2) bonus += r.n;
    if (r.station === 'alquimia' && Expansion.has('pestle')) for (let k = 0; k < times; k++) if (Math.random() < 0.3) bonus += r.n;
    if (bonus) { Inv.add(r.out, bonus); UI.msg(`🛠️ Suas ferramentas renderam +${bonus} ${ITEMS[r.out].name}.`, 'gold'); }
    if (coal) Inv.add('coal', times);
  };
  // martelo de carpinteiro: as construções gastam 15% menos (devolvido na hora)
  const pb0 = Game.placeBuilding.bind(Game);
  Game.placeBuilding = function () {
    const k = G.placing, b = BUILDINGS[k], before = b ? Object.fromEntries(Object.keys(b.cost).map(c => [c, Inv.count(c)])) : null;
    pb0();
    if (b && Expansion.has('carpenter_hammer')) { let back = 0; for (const c in before) { const spent = before[c] - Inv.count(c); const r = Math.floor(spent * 0.15); if (r > 0) { Inv.add(c, r); back += r; } } if (back) UI.msg(`🔨 O martelo de carpinteiro poupou ${back} materiais.`); }
  };
  // forcado e tesoura: criações rendem mais ao recolher
  const bc0 = Biz.collect.bind(Biz);
  Biz.collect = function (s) {
    if (s && s.goods && Expansion.has('pitchfork')) for (const k in s.goods) if (s.goods[k] > 0) s.goods[k] = Math.ceil(s.goods[k] * 1.2);
    return bc0(s);
  };
  // bestas usam virotes (ou flechas); armas mágicas gastam energia em vez de munição
  const a0 = Ranged.ammo.bind(Ranged);
  Ranged.ammo = function () { const w = P.equip.weapon && ITEMS[P.equip.weapon]; if (w && w.xbow && Inv.count('bolt') > 0) return 'bolt'; return a0(); };
  const s0 = Ranged.shoot.bind(Ranged);
  Ranged.shoot = function (aim) {
    const w = P.equip.weapon && ITEMS[P.equip.weapon];
    if (!w || !w.magic) return s0(aim);
    const cost = w.fast ? 6 : 9;
    if (P.stamina < cost) { if (G.realTime - (this.warn || 0) > 2.5) { this.warn = G.realTime; UI.msg('Sem energia para a magia: descanse ou beba uma Poção de Foco.', 'bad'); } P.atkCd = 0.5; return false; }
    P.stamina -= cost;
    const dmg = Game.pDmg() * (1 + Expansion.worn('magicB'));
    this.fire(P, aim, dmg, 'magic_' + w.magic);
    P.aim = aim; P.dir = Math.cos(aim) < 0 ? -1 : 1; P.swing = 0.25; P.atkCd = w.fast ? 0.42 : 0.6;
    Sound.play('bow', { vol: 0.6 });
    return true;
  };
  // armas mágicas: fogo queima, gelo deixa lento, tempestade salta para outro inimigo
  const d0 = Game.damage.bind(Game);
  Game.damage = function (target, amount, src) {
    if (src === P && target !== P && !target.dead) {
      const w = P.equip.weapon && ITEMS[P.equip.weapon];
      if (w && w.ranged && !w.magic) amount *= 1 + Expansion.worn('rangedB');
      if (['skeleton', 'skel_king'].includes(target.kind)) amount *= 1 + Expansion.worn('holyB') + (Farm.hasBuff && Farm.hasBuff('holy') ? 0.2 : 0);
    }
    return d0(target, amount, src);
  };
  const pu0 = Ranged.update.bind(Ranged);
  Ranged.update = function (dt) {
    for (const p of this.projs) if (p.kind && p.kind.startsWith('magic_') && !p.hooked) {
      p.hooked = true; const el = p.kind.slice(6), dmg0 = p.dmg;
      p.dmg = dmg0; p.onHit = el;
    }
    // os projéteis mágicos que acertaram alguém neste quadro aplicam o efeito
    const before = this.projs.filter(p => p.onHit && p.life > 0);
    pu0(dt);
    for (const p of before) if (p.life <= 0 && !p.applied) {
      p.applied = true;
      const t = G.ents.filter(e => !e.dead && U.dist(p.x, p.y, e.x, e.y - 14) < (e.r || 10) + 10)[0]; if (!t) continue;
      if (p.onHit === 'fire') { t.burn = { until: G.realTime + 3, dps: Math.max(4, p.dmg * 0.15) }; Game.burst(t.x, t.y - 14, '#ff6a1a', 10); }
      if (p.onHit === 'frost') { t.slowUntil = G.realTime + 3; Game.burst(t.x, t.y - 14, '#8ad8ff', 10); }
      if (p.onHit === 'storm') { const n = G.ents.find(e => e !== t && !e.dead && e.dmg > 0 && canHit(e) && U.dist(e.x, e.y, t.x, t.y) < 5 * TILE); if (n) { Game.damage(n, p.dmg * 0.6, P); Game.burst(n.x, n.y - 20, '#c8c0ff', 12); } }
    }
    // queimaduras e lentidão
    for (const e of G.ents) {
      if (e.dead) continue;
      if (e.burn) { if (G.realTime > e.burn.until) e.burn = null; else { e.burnT = (e.burnT || 0) - dt; if (e.burnT <= 0) { e.burnT = 0.5; Game.damage(e, e.burn.dps * 0.5, null); } } }
      if (e.slowUntil && G.realTime < e.slowUntil) { e.slowed = true; } else if (e.slowed) e.slowed = false;
    }
  };
  // a lentidão do gelo: o inimigo anda pela metade
  if (typeof moveEnt === 'function') {
    const m0 = moveEnt;
    // eslint-disable-next-line no-global-assign
    moveEnt = function (e, dx, dy) { if (e && e.slowed) { dx *= 0.45; dy *= 0.45; } return m0(e, dx, dy); };
  }
  // poção de foco: energia cheia
  const e0 = Game.eat.bind(Game);
  Game.eat = function (k) { const it = ITEMS[k], had = Inv.count(k); e0(k); if (it && it.stamina && Inv.count(k) < had) P.stamina = Game.maxSt(); };
  // itens de usar também funcionam nos bolsos rápidos
  const q0 = Game.useQuick.bind(Game);
  Game.useQuick = function (q) { const k = P.quick[q], it = k && ITEMS[k]; if (it && it.use && !it.food && !it.heal) { Expansion.use(k); return; } return q0(q); };
  // usar itens pelo inventário (pergaminhos, instrumentos...)
  const ua0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'expuse') { Expansion.use(d.k); if (UI.cur && UI.cur.fn === 'showInventory') UI.showInventory(); return; }
    return ua0(a, d);
  };
}
// armadilhas de caça: todo mês, as que estão na mochila pegam alguma coisa; a tesoura tosquia as ovelhas do curral
{
  const m0 = Content.monthTick.bind(Content);
  Content.monthTick = function () {
    m0();
    const traps = Math.min(3, Inv.count('hunting_trap'));
    if (traps) { const got = {}; for (let k = 0; k < traps; k++) { const it = U.pick(['rabbit_meat', 'rabbit_hide', 'rabbit_meat', 'fox_pelt', 'venison']); got[it] = (got[it] || 0) + 1; Inv.add(it, 1); } Game.note && Game.note('🪤 Armadilhas: ' + Object.entries(got).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ') + '.'); }
    if (Expansion.has('shears')) for (const s of Content.mine('pen')) { const sh = (s.animals && s.animals.sheep) || 0; if (sh) { s.goods = s.goods || {}; s.goods.wool = Math.min(60, (s.goods.wool || 0) + sh); } }
  };
}
