// A muralha de uma vila não invade a área de outra (vilas vizinhas: cada uma fecha só o seu lado).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [];
      // uma vila fundada ao lado de outra (a 23 blocos): nem a nova nem a antiga invadem a vizinha
      UI.msg = () => {}; let made = false;
      for (const v0 of World.villages.slice()) { for (const [dx, dy] of Array.from({ length: 96 }, (q, i) => { const a = i / 24 * Math.PI * 2, r = 22 + (i % 4); return [Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)]; })) {
        const x = v0.x + dx, y = v0.y + dy;
        if (!World.inb(x - 9, y - 7) || !World.inb(x + 9, y + 7) || !World.areaOk(x - 7, y - 5, 15, 12) || !World.areaFree(x - 8, y - 6, 17, 14) || World.villages.some(o => U.dist(o.x, o.y, x, y) < 22) || World.capitals.some(c => U.dist(c.x, c.y, x, y) < 15)) continue;
        Families.makeVillage({ x, y, civ: v0.civ, name: 'Vila Teste', free: true, day: G.day }); const nv = World.villages[World.villages.length - 1]; nv.prosper = 60; nv.level = 5; Towns.show(nv); v0.prosper = 60; v0.level = 5; Towns.show(v0); made = true; break; } if (made) break; }
      if (!made) bad.push('não achou lugar para fundar a vila do teste');
      for (const s of World.structs) {
        if (!s || s.removed || s.hidden || s.type !== 'vwall' || s.village === undefined) continue;
        const o = World.villages.find((v, i) => v && i !== s.village && !v.removed && Math.max(Math.abs(s.x - v.x), Math.abs(s.y - v.y) * 1.25) <= 16);
        if (o) bad.push(`muro de ${World.villages[s.village].name} em ${s.x},${s.y} dentro de ${o.name}`);
      }
      return bad.slice(0, 5).concat(bad.length > 5 ? [`(+${bad.length - 5})`] : []);
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
