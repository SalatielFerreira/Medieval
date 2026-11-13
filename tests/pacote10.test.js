// Pacote de dez melhorias: membros da sociedade clicáveis, imposto dos moradores e das suas casas, você no ranking da
// fama, sem a Crônica da dinastia, mapa e obras fechados dentro dos imóveis, templos espalhados pelo reino, sem o quadro
// de Atenção na Visão geral, a Árvore da casa nova e os Serviços explicados.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      const html = () => UI.panel.innerHTML;
      UI.msg = () => {}; UI.banner = () => {}; P.god = true; Secret.seed();
      // 1. membros clicáveis
      const k = 'crafts', S = Secret.S(); S.invites[k] = { by: (Secret.brothers(k)[0] || {}).id || 0, until: G.day + 3 }; Secret.accept(k);
      UI.sel.knav = 'x:ordens'; UI.showKingdom();
      const rows = UI.panel.querySelectorAll('.scx-bro.scx-click');
      ok(rows.length === Secret.brothers(k).filter(p => p.alive).length && rows.length > 0, `membros na página: ${rows.length} de ${Secret.brothers(k).length}`);
      if (rows[0]) { rows[0].click(); ok(UI.cur && UI.cur.fn === 'showTalk', 'clicar no membro não abriu a conversa'); }
      // 2. imposto
      const ci = G.civs.findIndex(c => c && !c.dead && c.ruler !== 'player'), c = G.civs[ci];
      let spot = null; for (let r = 4; r < 200 && !spot; r += 3) for (let a = 0; a < 32 && !spot; a++) { const x = Math.round(World.capitals[ci].x + Math.cos(a / 32 * 6.28) * r), y = Math.round(World.capitals[ci].y + Math.sin(a / 32 * 6.28) * r); if (World.terr[World.idx(x + 1, y + 1)] === ci && World.areaOk(x, y, 3, 3) && World.areaFree(x, y, 3, 3)) spot = { x, y }; }
      if (spot) {
        World.addStruct('house', spot.x, spot.y, 3, 2, 'player');
        const bill = Taxes.mine().find(b => b.ci === ci); ok(bill && bill.n > 0, 'a sua casa no reino não paga imposto');
        const vi = World.villages.findIndex(v => v && !v.free && v.civ === ci), res = vi >= 0 ? People.residents(vi).filter(p => p.alive && p.age >= 18 && !p.kin) : [];
        res.forEach(p => { p.purse = 500; });
        P.gold = 1000; const t0 = c.treasury; Taxes.monthTick();
        ok(P.gold === 1000 - bill.n && c.treasury >= t0 + bill.n, `o imposto não foi pago ao rei (${1000 - P.gold} de ${bill.n})`);
        ok(!res.length || res.some(p => p.purse < 500), 'os moradores não pagaram o imposto');
      } else out.push('sem lugar para a casa do teste');
      // 3. você no ranking da fama
      UI.close(); G.fame = 99999; UI.sel.dtab = 'heroes'; UI.sel.svSub = Object.assign(UI.sel.svSub || {}, { dyher: 'famosos' }); UI.showDiary();
      const dh = UI.panel.innerHTML; ok(/dv-(hr|pod)[^"]*you/.test(dh) && /1º lugar/.test(dh), 'você não aparece (em primeiro) no ranking da fama');
      // 4. sem a Crônica
      ok(typeof Book === 'undefined' && typeof UI.showBook !== 'function', 'a Crônica da dinastia ainda existe');
      UI.close();
      // 5 e 6. dentro de um imóvel: sem mapa e sem obras
      const st = World.structs.find(s => s && !s.removed && !s.hidden && Places.enterable && Places.enterable(s));
      if (st && Places.enterRoom(st)) {
        Game.render(); const mb = document.querySelector('#toolbar [data-tb="showMap"]'), bb = document.querySelector('#toolbar [data-tb="showBuild"]'); ok(mb && mb.hidden && getComputedStyle(mb).display === 'none' && bb && getComputedStyle(bb).display === 'none', 'o botão do mapa continua na barra dentro do imóvel');
        UI.showMap(); ok(!(UI.cur && UI.cur.fn === 'showMap') && !MapView.isOpen, 'o mapa abriu dentro do imóvel');
        ok(!Lugares.wins().some(w => w[0] === 'showMap'), 'as setas ainda passam pelo mapa');
        ok(Game.canBuild('chest', 0, 0), 'deu para construir dentro do imóvel');
        UI.showBuild(); ok(!(UI.cur && UI.cur.fn === 'showBuild'), 'o Construir abriu dentro do imóvel');
        Places.exit(true); Game.render(); ok(!mb.hidden, 'o botão do mapa não voltou ao sair');
      } else out.push('não entrou num imóvel para o teste');
      // 7. templos espalhados
      const L = Lodges.L(); const far = L.list.filter(x => U.dist(World.capitals[x.ci].x, World.capitals[x.ci].y, x.x, x.y) > 20).length;
      ok(L.v === 2 && far >= L.list.length * 0.6, `templos pouco espalhados: ${far} de ${L.list.length} longe da capital`);
      // 8. sem Atenção na Visão geral
      UI.sel.knav = 'overview'; UI.showKingdom(); ok(!/⚠️ Atenção/.test(html()), 'o quadro de Atenção ainda está na Visão geral');
      // 9. árvore nova
      UI.sel.knav = 'tree'; UI.sel.svSub = Object.assign(UI.sel.svSub || {}, { ln: 'arvore' }); UI.showKingdom();
      ok(UI.panel.querySelector('.av .av-card.hero') && UI.panel.querySelector('.av-side'), 'a Árvore da casa nova não apareceu');
      // 10. serviços explicados
      UI.sel.knav = 'x:outlaw'; UI.sel.olTab = 'merc'; UI.showKingdom();
      ok(UI.panel.querySelector('.svx-band') && UI.panel.querySelector('.svx-area.merc.on') && !UI.panel.querySelector('[data-act="svhelp"]') && /Contratar soldados/.test(html()), 'os Serviços não explicam as páginas (ou ainda têm o botão de ajuda)');
      // castelo, dinastia, sociedades (quem não é membro) e a conversa numa página
      UI.close(); UI.showCastle(G.civs.findIndex(c => c && !c.dead && c.ruler !== 'player'));
      ok(UI.panel.querySelector('.cs3-hero') && UI.panel.querySelectorAll('.cs3-act').length >= 3, 'o Castelo não foi redesenhado');
      UI.showLineage(); ok(UI.panel.querySelector('.dn-gen.now'), 'a Árvore da dinastia não foi redesenhada');
      UI.showLegacy(); ok(UI.panel.querySelector('.dn-pods') && UI.panel.querySelector('.dn-row.now'), 'o Placar da dinastia não foi redesenhado');
      KOrders.leave('teste'); UI.sel.knav = 'x:ordens'; UI.showKingdom(); ok(UI.panel.querySelectorAll('.sco-card').length === 7 && !/object Object/.test(html()), 'a página das sociedades (para quem não é membro) não foi redesenhada');
      const np = G.people.find(q => q.alive && q.age > 20 && q.rank === 'merchant'); if (np) { np.met = true; UI.showTalk(np.id); const pb = UI.panel.querySelector('.pb'); ok(pb.scrollHeight <= pb.clientHeight + 2, 'a conversa com o NPC precisa rolar');
        const ft = [...UI.panel.querySelectorAll('.pf-tabs .tab')].find(b => /Ficha/.test(b.textContent)); if (ft) { ft.click(); const ac = UI.panel.querySelector('.tk2-acts'); ok(UI.panel.querySelector('.tk2-r .pf') && (!ac || getComputedStyle(ac).display === 'none'), 'a Ficha do NPC aparece junto com as ações da conversa'); } }
      UI.close();
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
