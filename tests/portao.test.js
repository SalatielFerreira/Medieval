// O portão: construído pelo menu com muro seu, sem porteiro; configurado pelo governador e pelo rei do reino em que
// está (fora dos reinos, por você); regras novas (só caravanas do reino, isenção, inimigos em guerra) e a janela cabe.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.god = true;
      const spot = want => { for (let rr = 4; rr < 260; rr += 3) for (let k = 0; k < 32; k++) { const x = Math.round(P.x / TILE + Math.cos(k / 32 * 6.28) * rr), y = Math.round(P.y / TILE + Math.sin(k / 32 * 6.28) * rr); if (!World.inb(x - 7, y - 3) || !World.inb(x + 7, y + 3)) continue; const t = World.terr[World.idx(x, y)]; if (want === 'free' ? t >= 0 : !(t >= 0)) continue; let good = true; for (let j = y - 2; j <= y + 2 && good; j++) for (let i = x - 6; i <= x + 6; i++) if (!TINFO[World.tile(i, j)].walk || World.isWater(World.tile(i, j)) || World.sgrid[World.idx(i, j)] >= 0 || World.terr[World.idx(i, j)] !== t) { good = false; break; } if (good) return { x, y }; } return null; };
      const build = c => {
        for (let j = c.y - 2; j <= c.y + 2; j++) for (let i = c.x - 6; i <= c.x + 6; i++) World.obj[World.idx(i, j)] = 0;
        for (let i = c.x - 5; i <= c.x + 5; i++) if (i !== c.x) World.addStruct('wall_stone', i, c.y, 1, 1, 'player');
        P.x = (c.x + 0.5) * TILE; P.y = (c.y + 3) * TILE;
        UI.sel.bcat = 'infra'; UI.sel.build = 'c:vgate'; UI.showBuild();
        const btn = [...UI.panel.querySelectorAll('button')].find(b => b.dataset.k === 'c:vgate' && b.dataset.act === 'urban'); if (btn) btn.click();
        const mode = Urban.mode; G.mouse.wx = (c.x + 0.5) * TILE; G.mouse.wy = (c.y + 0.5) * TILE; if (Urban.mode) Urban.click(); Urban.stop && Urban.stop();
        return { mode, g: World.blocker(World.idx(c.x, c.y)) };
      };
      // fora dos reinos: você constrói pelo menu e configura
      const a = spot('free'); ok(a, 'sem terra livre para o teste');
      if (a) {
        const r = build(a); ok(r.mode === 'c:vgate', 'o botão do portão não abriu o modo de construir (sem governar)'); ok(r.g && r.g.type === 'vgate', 'o portão não foi construído');
        const g = r.g; if (g && g.type === 'vgate') {
          ok(Gate.realm(g) < 0 && Gate.canConfig(g), 'fora dos reinos você não configura o portão');
          ok(!Shops.keeper(g) && !G.people.some(p => p.rank === 'gatekeeper'), 'o portão ainda tem porteiro');
          Gate.open(g.id); ok(UI.cur && UI.cur.fn === 'showGate', 'a janela do portão não abriu');
          const pb = UI.panel.querySelector('.pb'); ok(pb.scrollHeight <= pb.clientHeight + 2, `a janela do portão precisa rolar (${pb.scrollHeight}/${pb.clientHeight})`);
          UI.act('gate', { s: g.id, k: 'toll', v: '40' }); ok(Gate.data(g).toll === 40, 'não mudou o pedágio');
          UI.act('gate', { s: g.id, k: 'manual', v: 'closed' }); ok(Gate.data(g).manual === 'closed' && g.blocks, 'não trancou');
          UI.act('gate', { s: g.id, k: 'manual', v: 'auto' });
          UI.act('gate', { s: g.id, k: 'onlyRealm', v: '1' }); ok(Gate.data(g).onlyRealm, 'a regra nova não ligou');
          UI.close();
        }
      }
      // dentro de um reino que não é seu: quem configura é o governador ou o rei
      const b = spot('realm'); ok(b, 'sem terra de reino para o teste');
      if (b) {
        const r = build(b), g = r.g; ok(g && g.type === 'vgate', 'o portão no reino não foi construído');
        if (g && g.type === 'vgate') {
          const ci = Gate.realm(g); ok(ci >= 0, 'o portão não está no reino');
          ok(!Gate.canConfig(g) || G.civs[ci].ruler === 'player', 'você configura o portão de um reino que não governa');
          const t0 = Gate.data(g).toll; UI.act('gate', { s: g.id, k: 'toll', v: '80' }); ok(Gate.data(g).toll === t0 || G.civs[ci].ruler === 'player', 'mudou o pedágio sem ser rei nem governador');
          ok(Gate.mine(g), 'quem ergueu o portão não pode mais mudar de lugar ou demolir');
          Game.becomeRuler(ci, 'teste'); UI.close(); ok(Gate.canConfig(g), 'o rei não configura o portão do reino');
          // regras das caravanas
          const d = Gate.data(g); d.manual = null; d.onlyRealm = true; d.toll = 10; const other = (ci + 1) % 7;
          const c1 = { id: 991, from: other, to: ci, path: [], pos: 0 }; Gate.caravanPass(c1, g); ok(c1.done, 'caravana de fora passou com "só caravanas do reino"');
          d.onlyRealm = false; d.allyFree = true; d.search = false; const g0 = P.gold; const c2 = { id: 992, from: ci, to: other, path: [], pos: 0 }; Gate.caravanPass(c2, g); ok(!c2.done && P.gold - g0 < 10 + 1 && P.gold - g0 >= 0, 'a caravana do próprio reino pagou pedágio com a isenção');
          ok(Gate.guarded(Gate.homeVillage(g)) || Gate.homeVillage(g) < 0, 'o portão sem porteiro não protege a vila');
        }
      }
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
