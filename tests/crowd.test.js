// Cidade cheia sem travar: só uma parte do povo na rua (Ajustes → Tela → Pessoas nas ruas; quem importa aparece
// sempre), as figuras das pessoas não ficam saindo e voltando da memória e os prédios são recortados no que têm desenhado.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      const vi = World.villages.findIndex(v => v && !v.free), v = World.villages[vi];
      v.prosper = 140; Towns.dayTick();
      for (let k = 0; k < 60 && People.residents(vi).length < 150; k++) Families.settle(v, vi, 1);
      P.x = v.x * TILE; P.y = (v.y + 1) * TILE; G.time = NIGHT_LEN + DAYLIGHT_LEN * 0.4;
      const onStreet = () => { let n = 0; for (const e of G.spawned.values()) if (e && !e.dead && e.vi === vi) n++; return n; };
      const clear = () => { for (const e of G.ents) if (e.kind === 'villager') e.dead = true; G.ents = G.ents.filter(e => !e.dead); G.spawned.clear(); };
      // Normal: ~60 na rua (mais os que importam)
      G.settings.streets = 'normal'; clear(); Game.ambient();
      const must = People.residents(vi).filter(p => Streets.keep(p, v)).length, n1 = onStreet();
      ok(n1 <= Math.max(60, must) + 2, `Normal: ${n1} na rua (limite 60, ${must} que importam)`);
      ok(People.residents(vi).filter(p => Streets.keep(p, v) && !p.port && !p.trip && !(p.jail > G.day)).every(p => G.spawned.has(p.id)), 'alguém que importa ficou fora da rua');
      // Todas: sem limite
      G.settings.streets = 'all'; clear(); Game.ambient(); const n2 = onStreet();
      ok(n2 > n1, `Todas não pôs mais gente na rua (${n2} contra ${n1})`);
      // jogo salvo sem a opção: vale Normal
      delete G.settings.streets; clear(); Game.ambient(); ok(onStreet() <= Math.max(60, must) + 2, 'sem a opção gravada não ficou no Normal');
      // a opção aparece nos Ajustes
      UI.showSettings('tela'); ok(/Pessoas nas ruas/.test(UI.panel.textContent) && UI.panel.querySelector('[data-k="streets"][data-v="few"]'), 'a opção Pessoas nas ruas não está nos Ajustes'); UI.close();
      // a memória de figuras cresce com a quantidade de gente
      ok(humanLimit() >= Math.min(3200, G.ents.length * 13), 'a memória das figuras não acompanha a quantidade de gente');
      // prédios: a figura guardada é recortada no que tem desenhado
      Game.render(); Game.render();
      const wall = World.structs.find(s => s && !s.removed && s.type === 'vwall' && RCache.map.get(s));
      if (wall) { const c = RCache.map.get(wall), fullW = Math.ceil((wall.w * TILE + RCACHE_PAD.l + RCACHE_PAD.r) * c.res); ok(c.cv.width < fullW / 2, `o muro não foi recortado (${c.cv.width} de ${fullW})`); }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
