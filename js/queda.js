'use strict';
// O rei caído: quando o trono passa para alguém de fora da família do rei (um golpe, a sociedade secreta, você tomando
// o reino), a corte dele (os quatro cargos do círculo do rei) e a família real (cônjuge, herdeiros e os filhos que moravam
// no castelo) são expulsos do castelo: vão morar numa vila do reino e perdem os títulos. Na sucessão normal (o filho,
// o cônjuge, um parente) ninguém sai.
const Fall = {
  // parentes: cônjuge, pais, filhos, irmãos ou a mesma família
  kin(a, b) {
    if (!a || !b) return false; if (a === b) return true;
    if (a.spouse === b.id || b.spouse === a.id) return true;
    if ((a.children || []).includes(b.id) || (b.children || []).includes(a.id)) return true;
    const pa = (a.parents || []).filter(x => typeof x === 'number'), pb = (b.parents || []).filter(x => typeof x === 'number');
    if (pa.some(x => pb.includes(x))) return true;
    return a.fam !== undefined && a.fam !== null && a.fam === b.fam;
  },
  snapshot(ci) {
    const c = G.civs[ci]; if (!c) return null;
    const old = c.rulerId !== null && c.rulerId !== undefined ? G.people[c.rulerId] : null;
    // (o rei que morreu no golpe já pode ter passado a coroa ao cônjuge ou ao herdeiro: quem estava no trono também sai)
    const fam = G.people.filter(p => p.alive && p.home && p.home.type === 'castle' && p.home.civ === ci && (p.rank === 'consort' || p.rank === 'heir' || p === old || (old && this.kin(p, old))));
    const cc = typeof Politics !== 'undefined' ? Politics.S().circle[ci] : null;
    const court = cc ? Object.values(cc).map(id => G.people[id]).filter(p => p && p.alive) : [];
    return { ci, old, oldName: c.rulerName, fam, court };
  },
  // tira do castelo: vai morar numa vila do reino (ou fica sem casa, se o reino não tem vilas)
  out(p, ci) {
    // a vila do reino com mais espaço (longe da corte: a capital fica por último)
    const cap = typeof Capital !== 'undefined' && Capital.of ? Capital.of(ci) : null;
    const vs = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.ruin && x.v.civ === ci)
      .map(x => ({ ...x, room: Families.vcap(x.v) - People.residents(x.i).length - (x.v === cap ? 1000 : 0) })).sort((a, b) => b.room - a.room);
    const x = vs[0] || null;
    p.home = x ? { type: 'village', idx: x.i } : { type: 'wild' };
    const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
    if (typeof Perf !== 'undefined' && Perf.resDirty) Perf.resDirty();
  },
  expel(s, newRuler) {
    if (!s) return 0;
    const keep = p => !p || !p.alive || p === newRuler || (newRuler && this.kin(p, newRuler)) || !!p.kin || p.spouse === 'player' || G.civs.some(o => o && o.rulerId === p.id && o.id !== s.ci);
    let nf = 0, nc = 0;
    for (const p of s.fam) { if (keep(p)) continue; this.out(p, s.ci); if (['heir', 'consort', 'ruler'].includes(p.rank)) p.rank = 'peasant'; p.exiled = s.ci; nf++; }
    const cc = typeof Politics !== 'undefined' ? Politics.S().circle[s.ci] : null;
    for (const p of s.court) {
      if (keep(p)) continue;
      if (cc) for (const k in cc) if (cc[k] === p.id) delete cc[k];
      if (p.home.type === 'castle' && p.home.civ === s.ci) { this.out(p, s.ci); p.exiled = s.ci; }
      delete p.bribed; nc++;
    }
    G.regency = (G.regency || []).filter(r => r.ci !== s.ci || (newRuler && r.regent === newRuler.id));
    if (nf || nc) {
      const t = `🚪 ${CIV_DEFS[s.ci].short}: ${nf ? `a família de ${s.oldName || 'o rei caído'}` : ''}${nf && nc ? ' e ' : ''}${nc ? `a corte ${nf ? 'dele' : `de ${s.oldName || 'o rei caído'}`}` : ''} ${nf + nc === 1 ? 'foi expulsa' : 'foram expulsos'} do castelo.`;
      UI.msg(t, ''); if (typeof Diplo !== 'undefined') Diplo.chronicle(t, false);
    }
    return nf + nc;
  },
};

{
  // um rei novo da IA: se não é parente do rei de antes, a família e a corte do rei caído saem do castelo
  const st0 = Succession.seat.bind(Succession);
  Succession.seat = function (c, p, rank) {
    const s = rank === 'ruler' && c ? Fall.snapshot(c.id) : null;
    const r = st0(c, p, rank);
    try { if (s && s.old && s.old !== p && !Fall.kin(s.old, p)) Fall.expel(s, p); } catch (e) { console.error(e); }
    return r;
  };
  // você toma o reino: a família e a corte do rei de antes saem (a não ser que você seja da família dele)
  const br0 = Game.becomeRuler.bind(Game);
  Game.becomeRuler = function (ci, ...a) {
    const c = G.civs[ci], s = c && c.ruler !== 'player' ? Fall.snapshot(ci) : null;
    const r = br0(ci, ...a);
    try { if (s && s.old && s.old.spouse !== 'player' && !s.old.kin) Fall.expel(s, null); } catch (e) { console.error(e); }
    return r;
  };
}
