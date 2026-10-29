'use strict';
// Uma música só, alegre e leve, em todo lugar (menu, campo, noite, vila, caverna, mar e batalha): melodia de flauta e
// alaúde em sol maior, num balanço de 6/8, com os acordes dedilhados de leve — sem tambor, sem pandeiro e sem o bordão.
Sound.TUNES.alegre = { bpm: 132, bar: 6, lead: 'flute', soft: true, nodrone: true, drum: [0, 0, 0, 0, 0, 0], jingle: [0, 0, 0, 0, 0, 0],
  mel: [
    [67, 2], [71, 1], [74, 2], [71, 1], [72, 2], [76, 1], [74, 3], [71, 2], [74, 1], [79, 2], [78, 1], [76, 2], [74, 1], [74, 3],
    [67, 2], [71, 1], [74, 2], [71, 1], [72, 2], [76, 1], [79, 2], [76, 1], [74, 2], [72, 1], [71, 2], [69, 1], [67, 6],
    [76, 2], [78, 1], [79, 2], [76, 1], [74, 2], [71, 1], [67, 3], [72, 2], [74, 1], [76, 2], [72, 1], [71, 2], [69, 1], [71, 3],
    [76, 2], [78, 1], [79, 2], [81, 1], [83, 2], [81, 1], [79, 3], [76, 2], [74, 1], [72, 2], [69, 1], [67, 6]],
  chords: [[43, 'M'], [48, 'M'], [43, 'M'], [50, 'M'], [43, 'M'], [48, 'M'], [50, 'M'], [43, 'M'],
    [40, 'm'], [43, 'M'], [48, 'M'], [43, 'M'], [40, 'm'], [43, 'M'], [50, 'M'], [43, 'M']] };

{
  const mu0 = Sound.music.bind(Sound);
  Sound.music = function () { return mu0('alegre'); }; // qualquer lugar ou momento: a mesma música (sem recomeçar)
}
