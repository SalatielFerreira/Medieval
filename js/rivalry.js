'use strict';
// Concorrência e brigas com motivo claro.
// Cada empreendimento seu numa vila tira fregueses das lojas do mesmo ramo: o dono perde dinheiro e a família dele junta
// rancor (mais rápido se você vende barato demais). O rancor tem etapas, sempre avisadas com o motivo:
//   30 → a família reclama · 60 → sabotagem (roubo no caixa ou na prateleira) · 90 → a família declara guerra à sua.
// Para acalmar: pagar uma indenização, investir nos negócios deles (Finanças), cobrar preços justos — e, sem disputa,
// o rancor esfria sozinho. Todo mês, quem mais enriqueceu ganha destaque nas notícias do mundo.

const RIVAL_BRANCH = { store: 'store', smith: 'smith', lumber: 'lumber', quarry: 'quarry', tavern: 'inn', fshop: 'store', fmill: 'mill', fforge: 'smith' };
const Rivalry = {
  branchOf(s) { return (typeof Work !== 'undefined' && Work.shopOf(s)) || RIVAL_BRANCH[s.type] || null; },
  // as lojas dos outros que vendem o mesmo que o seu empreendimento, na mesma vila (quanto mais coisas em comum, mais disputa)
  overlap(s, o) {
    const mine = new Set(Biz.catalog(s)), sh = SHOPS[this.branchOf(o)]; if (!sh || !mine.size) return 0;
    const both = sh.sells.filter(k => mine.has(k)).length; return both / Math.min(mine.size, sh.sells.length);
  },
  competitors(s) {
    const vi = Biz.crowd(s).vi; if (vi === null) return [];
    return World.structs.filter(o => o && !o.removed && !o.hidden && o.owner !== 'player' && o.village === vi && this.branchOf(o) && this.overlap(s, o) >= 0.2);
  },
  famOf(o) { if (o.fam !== undefined) return Families.get(o.fam); const k = Shops.keeper(o); return k ? Families.of(k) : null; },
  cheap(s) { const ks = Biz.catalog(s); if (!ks.length) return false; return ks.reduce((a, k) => a + Biz.itemMul(s, k), 0) / ks.length < 0.95; },
  fair(s) { const ks = Biz.catalog(s); if (!ks.length) return true; return ks.reduce((a, k) => a + Biz.itemMul(s, k), 0) / ks.length >= 1.1; },
  nm(s) { return BUILDINGS[s.type] ? BUILDINGS[s.type].name : s.type; },
  fem(s) { return /a$/.test(this.nm(s).split(' ')[0]); },
  seu(s) { return (this.fem(s) ? 'sua ' : 'seu ') + this.nm(s); },
  doSeu(s) { return (this.fem(s) ? 'da sua ' : 'do seu ') + this.nm(s); },
  oname(o) { return Places.def(o) ? Places.def(o).name(o) : (CIV_STRUCTS[o.type] || {}).name || o.type; },
  // todo mês, depois das vendas
  monthTick() {
    const touched = new Set();
    for (const s of Biz.list()) {
      if (!Biz.workerCount(s)) continue;
      const rev = (Biz.earn(s).cur || {}).rev || 0; if (rev <= 0) continue; // o que vendeu este mês
      const v = World.villages[Biz.crowd(s).vi];
      for (const o of this.competitors(s)) {
        const f = this.famOf(o); if (!f || f.player) continue;
        const k = Shops.keeper(o), lost = Math.round(Math.min(k ? People.purse(k) * 0.2 : 0, rev * 0.15 * this.overlap(s, o)));
        if (k && lost > 0) k.purse = People.purse(k) - lost;
        const cheap = this.cheap(s), ov = this.overlap(s, o), gain = Math.round((4 + rev / 50) * ov * 2 * (cheap ? 2 : this.fair(s) ? 0.5 : 1));
        if (gain <= 0) continue;
        f.grudge = Math.min(120, (f.grudge || 0) + gain); touched.add(f.id);
        f.grudgeWhy = `${this.seu(s)} em ${v ? v.name : 'na vila'} tira os fregueses de ${this.oname(o)}${cheap ? ', vendendo mais barato' : ''}${lost ? ` (eles perderam ${lost} 🪙 este mês)` : ''}`;
        this.stage(f, s);
      }
    }
    // sem disputa, o rancor esfria
    for (const f of Object.values(G.fams || {})) if (f.grudge && !touched.has(f.id)) { f.grudge = Math.max(0, f.grudge - 8); if (!f.grudge) { f.grudgeStage = 0; f.grudgeWhy = null; } }
    this.highlights();
  },
  stage(f, s) {
    const g = f.grudge, st = f.grudgeStage || 0, nm = Families.name(f);
    if (g >= 90 && st < 3 && !Court.isEnemy(f)) {
      f.grudgeStage = 3;
      const head = Families.members(f).filter(p => p.age >= 16 && !p.capanga).sort((a, b) => b.age - a.age)[0];
      UI.msg(`⚔️ A ${nm} perdeu a paciência: ${f.grudgeWhy}. Ela declarou guerra à sua família!`, 'bad', true);
      if (head) Court.npcWar(head);
      return;
    }
    if (g >= 60 && st >= 1 && Math.random() < 0.35) {
      f.grudgeStage = Math.max(st, 2);
      const took = Math.round((s.till || 0) * 0.6), keys = Object.keys(s.shelf || {}).filter(k => s.shelf[k] > 0);
      if (took > 5) { s.till -= took; UI.msg(`🦹 Alguém da ${nm} roubou ${took} 🪙 do caixa ${this.doSeu(s)}. Motivo: ${f.grudgeWhy}.`, 'bad', true); }
      else if (keys.length) { const k = U.pick(keys), n = Math.ceil(s.shelf[k] / 2); s.shelf[k] -= n; if (s.shelf[k] <= 0) delete s.shelf[k]; UI.msg(`🦹 Alguém da ${nm} levou ${n} ${ITEMS[k].name} da prateleira ${this.doSeu(s)}. Motivo: ${f.grudgeWhy}.`, 'bad', true); }
      if (typeof Rumors !== 'undefined') Rumors.atV(Biz.crowd(s).vi, `Dizem que a ${nm} anda sabotando ${this.fem(s) ? 'a' : 'o'} ${this.nm(s)} de ${G.name}.`);
      return;
    }
    if (g >= 30 && st < 1) { f.grudgeStage = 1; UI.msg(`😠 A ${nm} está irritada: ${f.grudgeWhy}. Se continuar, pode haver sabotagem (Portfólio → Empreendimentos → Concorrência).`, 'bad', true); }
  },
  peaceCost(f) { return Math.max(50, Math.round((f.grudge || 0) * 4)); },
  makePeace(fid) {
    const f = Families.get(fid); if (!f || !f.grudge) return;
    const c = this.peaceCost(f); if (P.gold < c) { UI.msg(`A indenização custa ${c} 🪙.`, 'bad'); return; }
    P.gold -= c; f.wealth = (f.wealth || 0) + c; f.grudge = 0; f.grudgeStage = 0; f.grudgeWhy = null;
    for (const p of Families.members(f)) People.addAff(p, 5);
    UI.msg(`🤝 Você pagou ${c} 🪙 de indenização à ${Families.name(f)}: o rancor acabou (por enquanto).`, 'gold'); Sound.play('coin');
  },
  // quadro da concorrência (Portfólio → Empreendimentos)
  html() {
    const list = Object.values(G.fams || {}).filter(f => f.grudge > 0).sort((a, b) => b.grudge - a.grudge);
    const rows = list.map(f => {
      const g = f.grudge, lvl = g >= 90 ? ['guerra', 'bad'] : g >= 60 ? ['sabotagem', 'bad'] : g >= 30 ? ['irritada', ''] : ['incomodada', 'muted'];
      return `<div class="crow"><span class="ri">${g >= 60 ? '😡' : '😠'}</span><span><b>${UI.esc(Families.name(f))}</b> <small class="${lvl[1]}">${lvl[0]}</small>
        <div class="va-bar" style="margin:4px 0"><i style="width:${Math.min(100, g / 90 * 100)}%;background:linear-gradient(90deg,#c8a040,#e04848)"></i></div><small>${UI.esc(f.grudgeWhy || 'disputa por fregueses')}</small></span>
        <span class="act-row"><button data-act="rivpeace" data-f="${f.id}" ${P.gold >= this.peaceCost(f) ? '' : 'disabled'}>🤝 Indenizar (${this.peaceCost(f)} 🪙)</button></span></div>`;
    }).join('');
    return `<div class="card"><div class="sec">⚔️ Concorrência <span>${list.length ? list.length + ' família(s) com rancor' : 'tudo em paz'}</span></div>
      ${rows || '<p class="muted">Nenhuma família está brava com os seus negócios.</p>'}
      <p class="dt-desc">Seus empreendimentos tiram fregueses das lojas do mesmo ramo na vila, e a família dona junta rancor: com <b>30</b> ela reclama, com <b>60</b> sabota (rouba o caixa ou a prateleira) e com <b>90</b> declara guerra à sua família. Preços justos (110% ou mais) deixam o rancor crescer devagar; vender barato demais dobra. Indenizar ou investir nos negócios deles (Finanças) acalma; sem disputa, ele esfria sozinho.</p></div>`;
  },
  // destaques do mês: quem mais enriqueceu vira notícia
  highlights() {
    const gains = [];
    for (const p of G.people) {
      if (!p.alive || p.kin || p.capanga || !People.PURSE[p.rank]) continue;
      const cur = People.purse(p), prev = p._lastPurse === undefined ? cur : p._lastPurse; p._lastPurse = cur;
      if (cur - prev >= 120) gains.push([cur - prev, p]);
    }
    gains.sort((a, b) => b[0] - a[0]);
    for (const [g, p] of gains.slice(0, 2)) {
      p.fame = (p.fame || 0) + 1;
      Diplo.chronicle(`📣 ${People.full(p)}, ${People.title(p).toLowerCase()} de ${People.homeName(p)}, prosperou: ganhou ${g} 🪙 este mês${p.fame >= 3 ? ' e já é um dos nomes mais conhecidos da região' : ''}.`);
    }
  },
};
{
  const bd0 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function (...a) { const r = bd0(...a); Rivalry.monthTick(); return r; };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { const h = kp0(nav); return nav === 'biz' && (this.sel.bizsub || 'contas') === 'contas' ? h + Rivalry.html() : h; };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'rivpeace') { Rivalry.makePeace(+d.f); this.refresh(); return; } return act0(a, d); };
  // investir nos negócios de uma família acalma o rancor dela
  const iv0 = Fin.invest.bind(Fin);
  Fin.invest = function (fid, n) { const f = Families.get(fid), had = f && f.grudge; iv0(fid, n); if (had) { f.grudge = Math.max(0, f.grudge - Math.round(n / 15)); if (!f.grudge) f.grudgeStage = 0; } };
}
