'use strict';
// Música por lugar e por momento: além do campo de dia, da noite, da caverna, da batalha e do menu, agora tocam
//  • 🏘️ a vila (dança alegre em sol maior) quando você está numa vila ou perto dela;
//  • 🍺 a taverna (giga rápida em lá menor, com pandeiro) dentro da taverna e da estalagem;
//  • ❄️ o inverno (melodia lenta e espaçada em mi menor) no campo, nos meses de neve;
//  • ⛵ o mar (canção de marinheiro em ré menor, 6/8) quando você navega.
Object.assign(Sound.TUNES, {
  village: { bpm: 120, bar: 8, lead: 'flute', drum: [3, 0, 1, 0, 2, 0, 1, 0], jingle: [0, 0, 0, 1, 0, 0, 0, 1],
    mel: [[67, 2], [69, 1], [71, 1], [72, 2], [74, 2], [72, 1], [71, 1], [69, 2], [67, 2], [0, 2], [67, 1], [71, 1], [74, 2], [79, 2], [78, 1], [76, 1], [74, 2], [72, 2], [71, 2],
      [71, 1], [72, 1], [74, 2], [76, 2], [74, 1], [72, 1], [71, 2], [69, 2], [67, 2], [66, 1], [67, 1], [69, 2], [67, 4], [0, 2],
      [74, 2], [76, 1], [78, 1], [79, 2], [78, 2], [76, 1], [74, 1], [72, 2], [71, 2], [69, 2], [71, 1], [72, 1], [74, 2], [71, 2], [69, 2], [67, 6]],
    chords: [[43, 'M'], [43, 'M'], [48, 'M'], [50, 'M'], [43, 'M'], [40, 'm'], [48, 'M'], [50, 'M'], [43, 'M'], [43, 'M'], [48, 'M'], [43, 'M']] },
  tavern: { bpm: 168, bar: 6, lead: 'lute', drum: [3, 0, 2, 3, 0, 2], jingle: [1, 0, 1, 1, 0, 1],
    mel: [[69, 1], [72, 1], [76, 1], [76, 1], [74, 1], [72, 1], [71, 1], [72, 1], [74, 1], [74, 2], [71, 1], [69, 1], [72, 1], [76, 1], [81, 2], [79, 1], [76, 1], [74, 1], [72, 1], [71, 3],
      [69, 1], [72, 1], [76, 1], [77, 2], [76, 1], [74, 1], [72, 1], [74, 1], [76, 2], [72, 1], [71, 1], [69, 1], [68, 1], [69, 3], [0, 3],
      [76, 1], [77, 1], [79, 1], [81, 2], [79, 1], [77, 1], [76, 1], [74, 1], [72, 2], [76, 1], [74, 1], [72, 1], [71, 1], [72, 1], [74, 1], [69, 3]],
    chords: [[45, 'm'], [45, 'm'], [43, 'M'], [43, 'M'], [45, 'm'], [41, 'M'], [40, 'M'], [45, 'm']] },
  winter: { bpm: 72, bar: 8, lead: 'flute', drum: [0, 0, 0, 0, 0, 0, 0, 0], jingle: [1, 0, 0, 0, 0, 0, 0, 0], sparse: true,
    mel: [[71, 4], [69, 2], [67, 2], [66, 6], [0, 2], [64, 3], [66, 1], [67, 4], [71, 4], [69, 8], [0, 4], [74, 3], [72, 1], [71, 4], [69, 2], [67, 2], [66, 4], [64, 8]],
    chords: [[40, 'm'], [48, 'M'], [43, 'M'], [50, 'M'], [40, 'm'], [45, 'm'], [47, 'M'], [40, 'm']] },
  sea: { bpm: 112, bar: 6, lead: 'flute', drum: [3, 0, 0, 2, 0, 0], jingle: [0, 0, 0, 0, 0, 0],
    mel: [[62, 1], [65, 2], [65, 1], [65, 2], [67, 1], [69, 2], [67, 1], [65, 2], [64, 1], [62, 3], [57, 3], [62, 1], [65, 2], [69, 1], [72, 2], [70, 1], [69, 3], [67, 3],
      [69, 1], [70, 2], [70, 1], [70, 2], [69, 1], [67, 2], [65, 1], [64, 2], [65, 1], [67, 3], [64, 3], [62, 1], [65, 2], [64, 1], [62, 2], [61, 1], [62, 6]],
    chords: [[50, 'm'], [50, 'm'], [48, 'M'], [45, 'M'], [50, 'm'], [46, 'M'], [48, 'M'], [50, 'm']] },
});

const Music = {
  // qual tema combina com onde você está e com a hora
  pick(mode) {
    if (mode === 'battle' || mode === 'cave' || mode === 'menu') return mode;
    if (G.place && G.place.kind === 'room' && /tavern|inn/.test(G.place.lay || '')) return 'tavern';
    if (P.sailing) return 'sea';
    if (mode === 'night') return 'night';
    if (G.place) return mode;
    if (Season.idx() === 3) return 'winter';
    if (Urban.villageNear(Math.floor(P.x / TILE), Math.floor(P.y / TILE), 22) >= 0 || World.capitals.some(c => U.dist(P.x / TILE, P.y / TILE, c.x, c.y) < 18)) return 'village';
    return mode;
  },
};
{
  const mu0 = Sound.music.bind(Sound);
  Sound.music = function (mode) { let m = mode; try { if (typeof G !== 'undefined' && G.state === 'play') m = Music.pick(mode); } catch (e) { m = mode; } return mu0(m); };
}
