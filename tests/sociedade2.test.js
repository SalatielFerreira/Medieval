// Sociedade secreta, administração: a régua de valores do templo vai até 100.000; a mensalidade aceita qualquer valor e
// quem fica 12 meses sem pagar é expulso; você escolhe o irmão de cada cargo; indica um irmão para o lugar de um
// governador ou de um rei, investe nele e é ele quem assume; o Grão-Mestre não recebe mais missões; o kit da sociedade
// (elmo, gibão, grevas e botas) sai todo na cor dela. As abas cabem na janela no computador e no celular.
'use strict';
const { open } = require('./harness');
const check = async (W, H, fails, tag) => {
  const { page, errors, close } = await open({ width: W, height: H });
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 500000; Secret.seed();
      const k = 'crafts', S0 = Secret.S(); S0.invites[k] = { by: (Secret.brothers(k)[0] || {}).id || 0, until: G.day + 3 }; Secret.accept(k);
      ok(Secret.key() === k, 'não entrou na sociedade');
      // Grão-Mestre: sem missões, só administra
      KOrders.S().pts = 10; G.fame = 200; Soc2.S().best[k] = 3; KOrders.newMission(); KOrders.monthTick();
      ok(KOrders.rank() === 3 && !KOrders.S().mission, 'o Grão-Mestre ainda recebe missões');
      UI.sel.knav = 'x:ordens'; UI.showKingdom(); ok(/administra a sociedade/.test(UI.panel.innerHTML), 'a página da sociedade não diz que o Grão-Mestre só administra');
      const tx = Math.round(P.x / TILE) + 5, ty = Math.round(P.y / TILE); World.freeArea(tx, ty, 3, 3); World.addStruct('soc_temple', tx, ty, 3, 3, 'player');
      // as abas cabem na janela
      for (const [tab] of Soc2.TABS) { Soc2.show(tab); const el = UI.panel.querySelector('.bk3-body'); ok(el && el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2, `aba ${tab} do templo passou da janela`); }
      // 1. a régua de valores até 100.000
      const S = Soc2.S(); S.vault = 0; Soc2.show('tesouro');
      const sel = UI.panel.querySelector('.bk3-amtsel'); ok(sel && sel.querySelector('[data-amt="100000"]'), 'a régua do templo não tem 100.000');
      if (sel) { sel.querySelector('[data-amt="100000"]').click(); const b = UI.panel.querySelector('.bk3-amt[data-op="vin"]'); ok(b && b.dataset.n === '100000' && !b.disabled, 'o botão de pôr no cofre não seguiu a régua até 100.000: ' + (b && b.dataset.n)); if (b) b.click(); ok(S.vault === 100000, 'não pôs 100.000 no cofre: ' + S.vault); }
      // 2. mensalidade livre e expulsão depois de 12 meses
      Soc2.show('tesouro'); const inp = document.getElementById('tpDues'); ok(inp, 'não há onde escrever a mensalidade');
      if (inp) { inp.value = '1234'; UI.act('tp', { op: 'dues' }); } ok(Soc2.duesValue() === 1234, 'a mensalidade não aceitou 1234: ' + Soc2.duesValue());
      const bros = Secret.brothers(k).filter(p => p.alive && p.age >= 18 && !p.capanga), poor = bros[0], rich = bros[1];
      poor.purse = 0; poor.socMiss = 11; rich.purse = 5000; rich.socMiss = 5;
      Soc2.monthTick();
      ok(!Secret.isBro(poor, k) && poor.socOut === k, 'quem ficou 12 meses sem pagar não foi expulso');
      ok(Secret.isBro(rich, k) && rich.socMiss === 0 && rich.purse <= 5000 - 1234, 'quem pagou não ficou em dia');
      ok(Soc2.S().log.some(l => /expulso/.test(l.t)), 'a expulsão não foi anotada no livro da loja');
      // 3. escolher o irmão do cargo
      const pick = Secret.brothers(k).filter(p => p.alive && p.age >= 18 && !p.capanga)[3]; pick.met = true; pick.aff = 40;
      Soc2.show('rede'); UI.act('tp', { op: 'post', k: 'tesoureiro' });
      ok(UI.panel.querySelector('.tp-pick') && UI.panel.querySelector(`[data-op="pick"][data-i="${pick.id}"]`), 'a lista para escolher o tesoureiro não apareceu');
      { const el = UI.panel.querySelector('.bk3-body'); ok(el.scrollHeight <= el.clientHeight + 2, 'a lista de irmãos passou da janela'); }
      UI.act('tp', { op: 'pick', k: 'tesoureiro', i: pick.id }); ok(Soc2.holder('tesoureiro') === pick, 'não nomeou o irmão escolhido');
      // 4. candidato a governador: indicar, investir, derrubar e empossar
      let gv = null, gb = null;
      for (const x of Soc2.govTargets()) { const r = People.residents(x.vi).find(p => p.alive && p.age >= 25 && !p.capanga && !p.kin && p !== x.p && Chiefdom.vilOf(p) < 0); if (r) { gv = x; gb = r; break; } }
      ok(gv, 'nenhum governador para o teste');
      if (gv) {
        gb.ssoc = k; delete gb.socOut; const key = 'g' + gv.vi;
        Soc2.show('poder'); UI.act('tp', { op: 'cand', k: key }); ok(UI.panel.querySelector(`[data-op="nom"][data-i="${gb.id}"]`), 'o irmão da vila não aparece para ser indicado');
        UI.act('tp', { op: 'nom', k: key, i: gb.id }); ok(Soc2.cand(key) && Soc2.cand(key).p === gb, 'não indicou o candidato');
        S.vault = 10000; Soc2.backCand(key, 2000); const chS = Soc2.govChance(gv.vi), inv = S.cand[key].inv; S.cand[key].inv = 0; const ch0 = Soc2.govChance(gv.vi); S.cand[key].inv = inv;
        ok(Soc2.support(key) === 0.5 && (chS > ch0 || chS === 0.95), `investir no candidato não aumentou a chance (${ch0} → ${chS})`);
        const r0 = Math.random; Math.random = () => 0.01; try { Soc2.topGov(gv.vi); } finally { Math.random = r0; }
        const v = World.villages[gv.vi]; Families.refresh();
        ok(v.chief === gb.id, 'o candidato não assumiu o governo da vila (ou perdeu depois)');
      }
      // candidato ao trono
      const kc = Soc2.kingTargets()[0], kb = Secret.brothers(k).find(p => p.alive && p.age >= 25 && !p.capanga && !p.kin && !G.civs.some(c => c.rulerId === p.id) && p !== gb);
      if (kc && kb) {
        const key = 'k' + kc.id; S.infl = 500; S.vault = 50000;
        Soc2.nominate(key, kb.id); Soc2.backCand(key, 10000); ok(Soc2.support(key) > 0.3, 'o apoio ao candidato ao trono não subiu');
        const r0 = Math.random; Math.random = () => 0.01; try { Soc2.topKing(kc.id); } finally { Math.random = r0; }
        ok(kc.rulerId === kb.id, 'o candidato não subiu ao trono');
      } else ok(false, 'nenhum rei ou irmão para o teste do trono');
      // 5. o kit da sociedade: as quatro peças na cor dela, vestidas
      UI.act('ko', { op: 'armor' });
      const d = KOrders.def(), kit = KOrders.armorKeys();
      ok(kit.length === 4 && kit.every(id => ITEMS[id] && P.equip[ITEMS[id].slot] === id), 'o kit não tem as quatro peças vestidas: ' + kit.map(id => P.equip[ITEMS[id] && ITEMS[id].slot]));
      ok(ITEMS['ko_helm_' + k].color === d.col && ITEMS['ko_tabard_' + k].color === d.col, 'o elmo e o gibão não estão na cor da sociedade');
      const lk = playerLook(); ok(lk.armor === d.col && lk.crest === d.cross && lk.helmet === d.col && lk.boots, 'o personagem não mostra o kit com o símbolo da sociedade');
      ok(/svg/.test(itemArt('ko_boots_' + k) || ''), 'as botas da sociedade não têm ícone');
      UI.close();
      return out;
    });
    fails.push(...out.map(x => `${tag}: ${x}`));
    if (errors.length) fails.push(`${tag}: erros: ` + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
};
module.exports = async () => { const fails = []; await check(1366, 720, fails, 'pc'); await check(844, 390, fails, 'celular'); return fails; };
