'use strict';
// Interação nos imóveis e com quem está dormindo.
//  • Ferreiro: a forja, a bigorna e a mó abrem Criar com a oficina do ferreiro liberada (Forja, Fundição e Oficina do
//    Armeiro — ele deixa você trabalhar lá); as estantes de ferramentas e de armas abrem a loja dele.
//  • Quem está dormindo também conversa: acorda (resmungando) para falar com você.
const OFICINA = {
  smith: { stations: ['forja', 'fundicao', 'armeiro'], work: ['furnace', 'anvil', 'grind'], shop: ['toolrack', 'weaponrack'], name: 'a oficina do ferreiro' },
};

const Oficinas = {
  here() { const s = G.place && G.place.src; return s && OFICINA[s.type] ? OFICINA[s.type] : null; },
  // dá função aos móveis de decoração da oficina
  arm() {
    const o = this.here(); if (!o || !Places.furn) return;
    for (const f of Places.furn) {
      const k = f.k || f.kind || f.type;
      if (!f.act && o.work.includes(k)) f.act = 'oficina';
      else if (!f.act && o.shop.includes(k)) f.act = 'shop';
    }
  },
};

{
  // ao entrar num imóvel com oficina, os móveis dela passam a funcionar
  const er0 = Places.enterRoom.bind(Places);
  Places.enterRoom = function (...a) { const r = er0(...a); try { Oficinas.arm(); } catch (e) { console.error(e); } return r; };
  const us0 = Places.use.bind(Places);
  Places.use = function (f) {
    if (f && f.act === 'oficina') { const o = Oficinas.here(); UI.msg(`🔨 Você usa ${o ? o.name : 'a oficina'}: forja, fundição e armeiro à mão.`); UI.showCrafting(); return; }
    return us0(f);
  };
  // o aviso na tela: forja, bigorna e mó, e as estantes da loja
  const fl0 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) {
    const k = f && (f.k || f.kind || f.type), N = { furnace: 'Forja', anvil: 'Bigorna', grind: 'Mó de afiar', toolrack: 'Estante de ferramentas', weaponrack: 'Estante de armas' };
    if (f && f.act === 'oficina') return `${N[k] || 'Oficina'} — forjar e fundir`;
    if (f && f.act === 'shop' && (k === 'toolrack' || k === 'weaponrack')) return `${N[k]} — comprar e vender`;
    return fl0(f);
  };
  // dentro da oficina, as bancadas dela contam como "por perto"
  const ns0 = Game.nearStation.bind(Game);
  Game.nearStation = function (st) { const o = Oficinas.here(); if (o && o.stations.includes(st)) return true; return ns0(st); };
  // quem está dormindo acorda para conversar
  const tk0 = UI.showTalk.bind(UI);
  UI.showTalk = function (id, ...rest) {
    const e = G.spawned && G.spawned.get(id);
    if (e && e.sleeping && !e.dead) { e.sleeping = false; e.woke = (G.realTime || 0) + 30; UI.msg(`😴 ${e.npc ? e.npc.name : 'A pessoa'} acordou, meio sonolent${e.npc && e.npc.sex === 'f' ? 'a' : 'o'}, para falar com você.`); }
    return tk0(id, ...rest);
  };
}
