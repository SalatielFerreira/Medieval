// Vilas vizinhas crescendo não erguem muralha sozinhas (nem invadem a área uma da outra): muralha só a da capital,
// as que o rei ou o governador erguem (como em volta do castelo, do cemitério, da catedral, da arena e do banco).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [];
      UI.msg = () => {};
      World.villages.forEach(v => { if (v) { v.prosper = 60; v.level = 5; Towns.show(v); } });
      const n = World.structs.filter(s => s && !s.removed && !s.hidden && s.type === 'vwall' && s.growth !== undefined).length;
      if (n) bad.push(`${n} trechos de muralha erguidos sozinhos pelas vilas`);
      // crescer leva o dobro do tempo
      if (VILLAGE_GROWTH !== 0.25) bad.push('as vilas continuam crescendo na velocidade antiga');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
