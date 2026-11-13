'use strict';
if (typeof PLAN_KEEP !== 'undefined' && !PLAN_KEEP.includes('prison')) PLAN_KEEP.push('prison'); // (o traçado das vilas não mexe na prisão)
// A capital de cada reino é uma vila: ao lado do castelo (e da arena, da prisão, do banco, da catedral e do cemitério,
// que fazem parte dela) nasce a vila da capital, com casas, armazém, taverna e capela, como as outras. O jogo começa com
// duas vilas por reino: a capital e a vila de antes. Gente poderosa e importante (nobres, mercadores ricos, cavaleiros)
// quer morar na capital, perto do rei. O rei pode mudar a capital do reino para outra vila (mesmo sem o castelo lá):
// a capital cresce mais depressa e atrai os importantes.
const Capital = {
  // um lugar livre perto do castelo, dentro do reino, longe das outras vilas
  spot(ci) {
    const cp = World.capitals[ci]; if (!cp) return null;
    for (let r = 12; r <= 44; r += 2) for (let a = 0; a < 40; a++) {
      const ang = a / 40 * Math.PI * 2 + ci, x = Math.round(cp.x + Math.cos(ang) * r), y = Math.round(cp.y + Math.sin(ang) * r * 0.85);
      if (!World.inb(x - 10, y - 8) || !World.inb(x + 10, y + 9)) continue;
      if (World.terr[World.idx(x, y)] !== ci) continue;
      if (!World.areaOk(x - 7, y - 5, 15, 12) || !World.areaFree(x - 8, y - 6, 17, 14)) continue;
      if (World.villages.some(v => v && U.dist(v.x, v.y, x, y) < 22)) continue;
      if (World.structs.some(o => o && !o.removed && ['cemetery', 'prison', 'arena', 'bank', 'cathedral', 'castle'].includes(o.type) && x + 10 > o.x && x - 10 < o.x + o.w && y + 8 > o.y && y - 8 < o.y + o.h)) continue; // (longe dos prédios do castelo: ao carregar, eles voltam aos mesmos lugares)
      if (World.structs.some(o => o && !o.removed && o.type === 'port' && Math.abs(o.x - x) < 14 && Math.abs(o.y - y) < 12)) continue; // (longe do porto: ao carregar, ele volta para o mesmo lugar)
      return { x, y };
    }
    return null;
  },
  isCap(vi) { const v = World.villages[vi]; return !!v && !v.free && G.civs[v.civ] && G.civs[v.civ].capVi === vi; },
  of(ci) { const c = G.civs[ci]; return c && World.villages[c.capVi] && !World.villages[c.capVi].ruin && World.villages[c.capVi].civ === ci ? World.villages[c.capVi] : null; },
  create(ci) {
    const c = G.civs[ci], p = this.spot(ci); if (!c || !p) return null;
    const spec = { name: CIV_DEFS[ci].short, x: p.x, y: p.y, civ: ci, day: G.day || 1, capital: true };
    const v = Families.makeVillage(spec); G.founded.push(spec);
    const vi = World.villages.indexOf(v); v.capital = true; v.prosper = 32; v.level = Towns.levelOf(v.prosper);
    for (const rank of ['merchant', 'innkeeper', 'merchant']) People.create({ age: U.rint(24, 50), rank, civ: ci, home: { type: 'village', idx: vi } });
    Families.settle(v, vi, 5);
    Towns.init(); Towns.show(v); Families.refresh && Families.refresh();
    c.capVi = vi;
    try { TownPlan.organize(vi, true); TownPlan.roads(vi); Ruas.reconnect(vi); } catch (e) { console.error(e); }
    try { if (typeof Shops !== 'undefined' && Shops.ensure) Shops.ensure(); } catch (e) { console.error(e); } // (o padre da capela, o lojista e o taverneiro já nascem com a vila)
    return v;
  },
  ensure() {
    let n = 0;
    for (const c of G.civs) {
      if (!c || c.dead || !World.capitals[c.id]) continue;
      const has = (G.founded || []).some(s => s.capital && s.civ === c.id);
      if (!has && !c.capTried) { c.capTried = true; if (this.create(c.id)) n++; }
      // a capital do reino: a vila da capital, se o rei não escolheu outra
      if (!World.villages[c.capVi] || World.villages[c.capVi].civ !== c.id) {
        let i = World.villages.findIndex(v => v && v.capital && v.civ === c.id);
        if (i < 0) { const cp = World.capitals[c.id]; i = World.villages.map((v, k) => ({ v, k })).filter(x => x.v && !x.v.free && !x.v.ruin && x.v.civ === c.id).sort((a, b) => U.dist(a.v.x, a.v.y, cp.x, cp.y) - U.dist(b.v.x, b.v.y, cp.x, cp.y)).map(x => x.k)[0]; if (i === undefined) i = -1; }
        if (i >= 0) c.capVi = i;
      }
    }
    if (n) {
      // a vila nova rearrumou o chão: as estradas em volta dos prédios do castelo e dos templos são refeitas
      for (const s of World.structs) if (s && !s.removed && !s.hidden && CROAD_TYPES.includes(s.type)) { try { CastleRoads.build(s); } catch (e) { console.error(e); } }
      if (typeof SocX !== 'undefined') { const S = CastleRoads.S(); for (const k of Object.keys(S)) if (k.startsWith('lodge@')) delete S[k]; for (const x of Lodges.L().list) { const s = Lodges.struct(x.k, x.ci); if (s) SocX.road(s); } }
      World.chunks.clear(); World.buildMinimap();
    }
    return n;
  },
  // o rei muda a capital
  move(ci, vi) {
    const c = G.civs[ci], v = World.villages[vi];
    if (!c || c.ruler !== 'player') { UI.msg('Só o soberano do reino muda a capital.', 'bad'); return; }
    if (!v || v.free || v.civ !== ci || v.ruin) { UI.msg('A capital precisa ser uma vila do reino.', 'bad'); return; }
    const old = this.of(ci); c.capVi = vi; Game.addRelation && c.happy !== undefined && (c.happy = Math.max(0, c.happy - 3));
    UI.banner(`👑 ${v.name} é a nova capital`);
    UI.msg(`👑 ${v.name} agora é a capital de ${CIV_DEFS[ci].short}${old ? ` (antes era ${old.name})` : ''}. A gente importante do reino vai querer morar lá.`, 'gold', true);
    Diplo.chronicle(`👑 ${c.rulerName} mudou a capital de ${CIV_DEFS[ci].name} para ${v.name}.`, true);
  },
  // todo mês: a capital cresce e atrai os importantes do reino
  monthTick() {
    for (const c of G.civs) {
      if (!c || c.dead || c.anarchy) continue;
      const v = this.of(c.id); if (!v) continue; const vi = World.villages.indexOf(v);
      v.prosper = Math.min(PROSPER_MAX, (v.prosper || 0) + 1.5);
      if (Math.random() > 0.35 || People.residents(vi).length >= Families.vcap(v) - 2) continue;
      // uma família importante de outra vila do reino se muda para a capital
      const imp = p => NOBLE_RANKS.includes(p.rank) || p.rank === 'knight' || (p.rank === 'merchant' && (Families.of(p) || {}).wealth > 400);
      const cand = World.villages.map((o, i) => ({ o, i })).filter(x => x.i !== vi && x.o && !x.o.free && x.o.civ === c.id)
        .flatMap(x => People.residents(x.i).filter(p => p.alive && p.age >= 20 && !p.kin && !p.capanga && !p.shop && !p.job && !Families.isChief(p) && imp(p)).map(p => ({ p, from: x.i })));
      const pick = cand.sort((a, b) => ((Families.of(b.p) || {}).wealth || 0) - ((Families.of(a.p) || {}).wealth || 0))[0]; if (!pick) continue;
      const f = Families.of(pick.p), fam = (f ? Families.members(f) : [pick.p]).filter(q => q.alive && q.home.type === 'village' && q.home.idx === pick.from && !q.shop && !q.job && !q.capanga);
      for (const q of fam) q.home = { type: 'village', idx: vi };
      if (c.ruler === 'player' || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 60) Game.note(`👑 A família de ${People.full(pick.p)} se mudou para ${v.name}, para morar perto da corte.`);
    }
  },
};

{
  // as vilas fundadas guardam se são a da capital (ao recriar no carregamento)
  const mv0 = Families.makeVillage.bind(Families);
  Families.makeVillage = function (spec, ...a) { const v = mv0(spec, ...a); if (spec && spec.capital) v.capital = true; return v; };
  // os prédios do castelo guardam o lugar de agora: ao carregar, voltam exatamente para lá (a vila da capital, recriada
  // antes deles, não toma o lugar de nenhum)
  const pin = () => {
    const U2 = G.urban || (G.urban = {}); U2.prisonAt = U2.prisonAt || {}; U2.cem = U2.cem || {};
    World.capitals.forEach((cp, ci) => {
      if (!cp) return;
      const pr = typeof Prison !== 'undefined' ? Prison.of(ci) : null; if (pr && !U2.prisonAt[ci]) U2.prisonAt[ci] = { x: pr.x, y: pr.y };
      const cm = World.structs.find(o => o && !o.removed && o.type === 'cemetery' && o.owner === ci); if (cm && !U2.cem[ci]) U2.cem[ci] = { x: cm.x, y: cm.y };
    });
  };
  const run = () => { try { pin(); } catch (e) { console.error(e); } try { Capital.ensure(); } catch (e) { console.error(e); } try { Ruas.connectAll(); } catch (e) { console.error(e); } try { Towns.settle(); } catch (e) { console.error(e); } }; // (o que ficou encavalado ao recriar templos e vilas é arrumado)
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); if (G.state === 'play') run(); return r; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play') run(); return r; };
  // obra nova numa vila (dos moradores ou do governador): o responsável é contratado no mesmo dia, não só ao carregar
  let needShops = false;
  const ac0 = Urban.addCivic.bind(Urban);
  Urban.addCivic = function (type, tx, ty, vi, quiet, ...a) { const r = ac0(type, tx, ty, vi, quiet, ...a); if (!quiet) needShops = true; return r; };
  const dt0 = Towns.dayTick.bind(Towns);
  Towns.dayTick = function (...a) { const r = dt0(...a); if (needShops) { needShops = false; try { Shops.ensure(); } catch (e) { console.error(e); } } return r; };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Capital.monthTick(); } catch (e) { console.error(e); } try { Shops.ensure(); Ports.ensureKeepers(); } catch (e) { console.error(e); } }; // (imóveis novos já ganham o responsável no mês)
  // no Reinado: uma etiqueta "👑 Capital" na faixa do reino; clicar abre a escolha da capital
  const kg0 = Reinado.king.bind(Reinado);
  Reinado.king = function (ci, ...a) {
    const h = kg0(ci, ...a), cap = Capital.of(ci);
    // (na linha do título do reino, sem ocupar mais altura)
    return h.replace(/(<span class="rg-who"><b>[^<]*<\/b><small>)/, `$1<button class="link rn-caplink" data-act="capopen" data-c="${ci}" title="Mudar a capital do reino">👑 capital: ${UI.esc(cap ? cap.name : '—')}</button> · `);
  };
  // a vila da capital fica com a coroa: não vira feudo de um vassalo
  if (typeof Reign !== 'undefined' && Reign.fiefOk) { const fo0 = Reign.fiefOk.bind(Reign); Reign.fiefOk = function (vi, ...a) { return !Capital.isCap(vi) && fo0(vi, ...a); }; }
  UI.showCapital = function (ci) {
    const c = G.civs[ci], esc = UI.esc.bind(UI), vs = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.free && !x.v.ruin && x.v.civ === ci);
    this.open('👑 A capital do reino', `<div class="card"><p class="dt-desc">A capital cresce mais depressa e atrai a gente importante do reino (nobres, cavaleiros e mercadores ricos), mesmo que o castelo não fique lá.</p>
      ${vs.map(x => `<div class="crow"><span class="ri">${c.capVi === x.i ? '👑' : '🏘️'}</span><span><b>${esc(x.v.name)}</b><small>nível ${x.v.level || 1} · ${People.residents(x.i).length} moradores${x.v.capital ? ' · ao lado do castelo' : ''}</small></span><span class="act-row">${c.capVi === x.i ? '<b class="ok">capital</b>' : `<button class="primary" data-act="capmove" data-c="${ci}" data-v="${x.i}" ${c.ruler === 'player' ? '' : 'disabled'}>Tornar capital</button>`}</span></div>`).join('')}</div>`, 'showCapital', [ci], CIV_DEFS[ci].name);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'capopen') { UI.showCapital(+d.c); return; }
    if (a !== 'capmove') return a0(a, d);
    const ci = +d.c, vi = +d.v;
    Dialog.confirm({ icon: '👑', title: 'Mudar a capital', ok: 'Mudar', text: `Fazer de ${World.villages[vi].name} a capital de ${CIV_DEFS[ci].short}? O castelo continua onde está.` }, () => { Capital.move(ci, vi); UI.showCapital(ci); });
  };
}
