'use strict';
// Obras em qualquer lugar: as obras da janela Obras (na vila / no reino) se erguem em todo o mapa e nas vilas
// independentes; só não dentro de um reino que não é seu.
//  • Na sua vila (governador) ou numa vila do seu reino (rei): a obra é da vila, como sempre foi.
//  • Em qualquer outro lugar (terra livre, vila independente de outro governador, fora das vilas do seu reino): a obra é
//    sua. A renda dela vai para você todo mês, só você demole ou muda de lugar, e o responsável vem da vila mais perto.
//    Ela não entra no traçado nem nas contas da vila (é um imóvel seu).
//  • Ficam com as regras delas: a muralha e o portão (da vila), e o banco, o porto, o cemitério e a arena (do reino).
const OP_KEEP = ['vgate', 'vwall', 'bank', 'port', 'cemetery', 'arena'];
const OP_TIED = ['tavern', 'chapel'];

const ObrasPlus = {
  // de quem fica a obra neste lugar: da vila (onde você governa) ou sua
  home(tx, ty, w, h) {
    const cx = Math.floor(tx + w / 2), cy = Math.floor(ty + h / 2), a = Urban.authority(cx, cy), vi = Urban.villageNear(cx, cy, VILLAGE_R + 2), v = World.villages[vi];
    if (a && v && (a.kind === 'king' ? !v.free && v.civ === a.civ : a.vi === vi)) return { vi, mine: false };
    return { vi: -1, mine: true };
  },
  typeOf(def) { return def && Object.keys(CIVIC).find(k => CIVIC[k] === def || (CIVIC[k].name === def.name && CIVIC[k].w === def.w && CIVIC[k].h === def.h)); },
  // o chão serve? (o mesmo do imóvel de vila, sem a parte de quem manda)
  groundErr(def, tx, ty, s) {
    for (let y = ty; y < ty + def.h; y++) for (let x = tx; x < tx + def.w; x++) {
      if (!World.inb(x, y)) return 'Fora do mapa';
      const i = World.idx(x, y), t = World.tiles[i];
      if (!TINFO[t].walk || t === T.WATER || t === T.BRIDGE) return 'Terreno inválido';
      if (t === T.ROAD) return 'Não construa sobre a estrada';
      if (World.obj[i]) return 'Remova árvores/rochas primeiro';
      const b = World.blocker(i); if (b && (!s || b.id !== s.id)) return 'Já há uma construção aqui';
    }
    if (def.blocks !== false && P.x + P.r > tx * TILE && P.x - P.r < (tx + def.w) * TILE && P.y > ty * TILE && P.y - P.r < (ty + def.h) * TILE) return 'Você está no caminho';
    // um bloco de folga das construções dos outros (as portas e as ruas ficam livres)
    for (const o of World.structs) {
      if (!o || o === s || o.hidden || o.removed || o.mine || (typeof o.owner !== 'number' && o.owner !== 'bandit') || Urban.ownStruct(o)) continue;
      if (tx < o.x + o.w + 1 && tx + def.w > o.x - 1 && ty < o.y + o.h + 1 && ty + def.h > o.y - 1) return 'Encostado demais em outra construção';
    }
    return null;
  },
  // o reino que "empresta" a cor e o povo à sua obra: o da vila mais perto
  civOf(s) { const v = World.villages[Work.vi(s)]; return v ? v.civ : 0; },
  mineList() { return World.structs.filter(s => s && s.mine && !s.removed && CIVIC[s.type]); },
  // ergue a obra sua (fora das vilas que você governa)
  raise(type, tx, ty) {
    const d = CIVIC[type], m = Urban.mode; Urban.mode = null; // não conta como obra numa vila (nem como feito para a eleição)
    let s; try { s = Urban.addCivic(type, tx, ty, -1); } finally { Urban.mode = m; }
    const E = Urban.E(), a = E.added[E.added.length - 1];
    if (a && a.type === type && a.x === tx && a.y === ty) a.mine = true;
    this.own(s);
    World.touchArea(tx, ty, d.w, d.h);
    if (SHOP_KEEPER[type]) Shops.ensure();
    return s;
  },
  // a taverna e a capela vivem do taverneiro e do padre de uma vila: as suas ficam ligadas à vila mais perto
  own(s) { if (!s) return; s.mine = true; delete s.village; s.owner = this.civOf(s); if (OP_TIED.includes(s.type)) s.village = Work.vi(s); },
  // o rendimento das suas obras (aluguel e o que produzem, vendido) vai para você
  monthTick() {
    let g = 0;
    for (const s of this.mineList()) {
      const d = VWORKS[s.type]; if (!d) continue;
      g += d.rent || 0; for (const n of Object.values(d.stock || {})) g += Math.round(n * 1.5);
    }
    if (g > 0) { P.gold += g; Game.note(`🏗️ As suas obras fora das vilas renderam ${g} 🪙.`, 'gold'); }
  },
};

{
  // onde a obra pode ficar
  const pe0 = Urban.placeErr.bind(Urban);
  Urban.placeErr = function (def, tx, ty, s, civic) {
    const type = s ? s.type : ObrasPlus.typeOf(def);
    if (!civic || !type || OP_KEEP.includes(type) || (s && !s.mine)) return pe0(def, tx, ty, s, civic);
    const fr = this.foreignRealm(tx, ty, def.w, def.h); if (fr >= 0) return this.foreignErr(fr);
    if (s) return ObrasPlus.groundErr(def, tx, ty, s); // a sua obra muda de lugar e continua sua
    if (!ObrasPlus.home(tx, ty, def.w, def.h).mine) return pe0(def, tx, ty, s, civic); // na sua vila ou no seu reino: as regras de sempre
    return ObrasPlus.groundErr(def, tx, ty, null);
  };
  // erguer: fora de onde você governa, a obra fica sua
  const ck0 = Urban.click.bind(Urban);
  Urban.click = function () {
    const type = this.mode && this.mode.startsWith('c:') ? this.mode.slice(2) : null;
    if (!type || !CIVIC[type] || OP_KEEP.includes(type)) return ck0();
    const d = CIVIC[type], p = this.ghost(d.w, d.h);
    if (!ObrasPlus.home(p.x, p.y, d.w, d.h).mine) return ck0();
    const err = this.placeErr(Object.assign({ blocks: CIV_STRUCTS[type].blocks }, d), p.x, p.y, null, true);
    if (err) { this.warn(err); return; }
    if (!Inv.has(d.cost)) { this.warn(`Faltam materiais para ${d.name}.`); return; }
    Inv.pay(d.cost);
    ObrasPlus.raise(type, p.x, p.y);
    Game.burst((p.x + d.w / 2) * TILE, (p.y + d.h / 2) * TILE, '#c9a978', 18);
    Sound.play('build');
    UI.msg(`🏗️ ${d.name} construíd${/a$/.test(d.name) ? 'a' : 'o'}: é sua (a renda vai para você).`, 'gold');
    Progress.add('built');
    if (!Inv.has(d.cost)) this.stop();
  };
  // a sua obra: só você mexe
  const mv0 = Urban.movable.bind(Urban);
  Urban.movable = function (s) { return s && s.mine ? null : mv0(s); };
  // tem responsável (de qualquer jeito, sem ser de uma vila)
  const is0 = Shops.isShop.bind(Shops);
  Shops.isShop = function (s) { if (s && s.mine) return !s.removed && !s.hidden && SHOP_KEEPER[s.type] !== undefined && (!WORKPLACES[s.type] || !!Work.spec(s)) && Work.vi(s) >= 0; return is0(s); };
  // as lojas de sempre (armazém, ferreiro, madeireira, pedreira) abrem com a vila de quem cuida delas
  const us0 = Game.useStruct.bind(Game);
  Game.useStruct = function (s) {
    if (s && s.mine && ['store', 'smith', 'lumber', 'quarry'].includes(s.type)) { UI.showShop(s.type, Work.vi(s)); return; }
    return us0(s);
  };
  // o nome: "Sua Padaria", "Seu Correio"
  const wd0 = Work.def.bind(Work);
  Work.def = function (s) {
    const d = wd0(s); if (!d || !s || !s.mine) return d;
    const n = CIV_STRUCTS[s.type] ? CIV_STRUCTS[s.type].name : s.type;
    return Object.assign({}, d, { name: () => `${/a$/.test(n.split(' ')[0]) ? 'Sua' : 'Seu'} ${n}` });
  };
  // a sua obra não entra no traçado de nenhuma vila
  const tm0 = TownPlan.members.bind(TownPlan);
  TownPlan.members = function (vi) { return tm0(vi).filter(s => !s.mine); };
  // jogo salvo: as suas obras voltam suas
  const rs0 = Urban.restore.bind(Urban);
  Urban.restore = function (...a) {
    const r = rs0(...a);
    for (const q of this.E().added) if (q.mine) { const s = World.structs.find(o => o && !o.removed && o.type === q.type && o.x === q.x && o.y === q.y); ObrasPlus.own(s); }
    return r;
  };
  // todo mês: a renda das suas obras
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { ObrasPlus.monthTick(); } catch (e) { console.error(e); } };
}
