'use strict';
// Assassinos e caçadores de recompensa de verdade: quem vem atrás de você não surge do nada. É um morador das vilas,
// com nome, família, personalidade e vida própria, que aceitou o serviço:
//  • 🗡️ assassino: contratado por uma casa em guerra com a sua (ou por um conspirador da corte); de preferência alguém
//    da região de quem paga, pobre, com mau gênio ou ganancioso, que não gosta de você.
//  • 🎯 caçador de recompensa: atrás do prêmio pela sua cabeça (fora da lei); mercenários, caçadores e andarilhos.
// O contratado fica em p.hit = { kind, by, why, since }. Enquanto caça você é hostil (matá-lo é legítima defesa, não
// crime); se escapa, volta a tentar até o serviço acabar. Quando o serviço acaba (a guerra termina, a recompensa
// esfria), ele volta para a vida dele. Morto, a notícia corre: você sabe quem era e quem pagou.
const HIT_RANKS = { mercenary: 4, hunter: 3, wanderer: 3, beggar: 3, soldier: 1, peasant: 2, sailor: 2 };

const Hitmen = {
  mode: null, busy: false,
  // quem paga pelos assassinos agora: uma casa em guerra com a sua, se houver
  payer() {
    const pf = Families.ensurePlayer();
    const fs = (pf.enemies || []).map(id => Families.get(id)).filter(f => f && f.warOn && Families.members(f).length);
    return fs.length ? U.pick(fs) : null;
  },
  // quem aceitaria o serviço
  fit(p, kind) {
    if (!p.alive || p.age < 18 || p.age > 52 || p.kin || p.capanga || p.spouse === 'player' || p.hit || p.band) return false;
    if (!RANKS[p.rank] || RANKS[p.rank].noble || RANKS[p.rank].shop || NOBLE_RANKS.includes(p.rank) || People.isCourt(p) || p.port || p.trip) return false;
    if (p.job !== undefined && p.job !== null) return false;
    if (p.jail || p.prison) return false;
    const f = Families.of(p); if (f && f.player) return false;
    const e = G.spawned.get(p.id); if (e && !e.dead) return false;
    return kind === 'hunter' ? p.aff < 40 : p.aff < 25;
  },
  score(p, kind, near) {
    const t = TRAITS[p.trait] || {};
    return (HIT_RANKS[p.rank] || 0) + (t.fights ? 2 : 0) + (p.trait === 'ganancioso' ? 2 : 0) + (p.aff < 0 ? 1.5 : 0)
      + (near && near(p) ? 3 : 0) + (kind === 'hunter' && ['mercenary', 'hunter'].includes(p.rank) ? 2 : 0) + Math.random() * 2;
  },
  // escolhe (ou continua com) quem vai atrás de você
  pick(kind) {
    const again = G.people.find(p => p.alive && p.hit && p.hit.kind === kind && !(G.spawned.get(p.id) && !G.spawned.get(p.id).dead));
    if (again) return again;
    const f = kind === 'assassin' ? this.payer() : null;
    const near = f && typeof f.seat === 'number' && World.villages[f.seat] ? (v => p => p.home.type === 'village' && World.villages[p.home.idx] && U.dist(World.villages[p.home.idx].x, World.villages[p.home.idx].y, v.x, v.y) < 60)(World.villages[f.seat]) : null;
    let best = null, bs = -1;
    for (const p of G.people) { if (!this.fit(p, kind)) continue; const s = this.score(p, kind, near); if (s > bs) { bs = s; best = p; } }
    if (!best) {
      // ninguém aceitou: chega alguém de fora, que passa a morar na vila mais perto
      let vi = -1, bd = 1e9; World.villages.forEach((v, i) => { if (!v || v.ruin) return; const d = U.dist(v.x, v.y, P.x / TILE, P.y / TILE); if (d < bd) { bd = d; vi = i; } });
      best = People.create({ rank: kind === 'hunter' ? 'mercenary' : 'wanderer', civ: vi >= 0 ? Math.max(-1, World.villages[vi].civ) : -1, home: vi >= 0 ? { type: 'village', idx: vi } : { type: 'wild' }, age: U.rint(22, 44), trait: U.pick(['ganancioso', 'orgulhoso', 'rabugento']) });
      best.aff = -20;
    }
    const tb = typeof OutLaw !== 'undefined' ? OutLaw.totalBounty() : 0;
    best.hit = kind === 'assassin'
      ? { kind, by: f ? Families.name(f) : 'um inimigo da corte', fam: f ? f.id : null, why: f ? `pago pela ${Families.name(f)}, em guerra com a sua família` : 'pago por um conspirador da corte', since: G.day }
      : { kind, by: 'a recompensa pela sua cabeça', why: `atrás da recompensa de ${tb} 🪙`, since: G.day };
    best.met = true;
    return best;
  },
  // a pessoa sai atrás de você: forte como um bandido (ou mais, pela força dela)
  arm(e, p) {
    const st = typeof Ranking !== 'undefined' ? Ranking.stats(p) : {};
    e.maxHp = e.hp = 60 + Math.round((st.str || 40) * 0.6); e.dmg = 9 + Math.round((st.str || 40) / 12);
    e.spMul = 2; e.angry = true; e.target = P; e.aggroOv = 30; e.hitman = p.hit.kind; p.hostile = true;
    G.spawned.set(p.id, e);
  },
  say(p) {
    const k = p.hit.kind, art = p.sex === 'f' ? 'a' : 'o';
    UI.msg(`${k === 'hunter' ? '🎯' : '🗡️'} ${People.full(p)}, ${People.title(p).toLowerCase()} de ${People.homeName(p)} (${(TRAITS[p.trait] || {}).name || ''}), vem atrás de você: ${p.hit.why}.`, 'bad', true);
    if (typeof Rumors !== 'undefined') Rumors.atP(`Viram ${People.full(p)} afiando a lâmina: dizem que ${art === 'a' ? 'ela' : 'ele'} aceitou matar ${G.name} por dinheiro.`);
  },
  // o serviço acabou: quem não está mais sendo pago volta para a vida dele
  monthTick() {
    const pf = Families.ensurePlayer(), tb = typeof OutLaw !== 'undefined' ? OutLaw.totalBounty() : 0;
    for (const p of G.people) {
      if (!p.hit || !p.alive) continue;
      const e = G.spawned.get(p.id); if (e && !e.dead) continue;
      const f = p.hit.fam !== null && p.hit.fam !== undefined ? Families.get(p.hit.fam) : null;
      const over = p.hit.kind === 'hunter' ? tb <= 300 : !(G.assassins > 0) || (f && !(pf.enemies || []).includes(f.id));
      if (!over) continue;
      delete p.hit; if (p.aff > -60) p.hostile = false;
    }
  },
  died(p, cause) {
    if (!p.hit) return;
    const k = p.hit.kind;
    if (cause === 'morto por você') {
      UI.msg(`${k === 'hunter' ? '🎯' : '🗡️'} ${People.full(p)} está morto. ${p.sex === 'f' ? 'Era a' : 'Era o'} ${k === 'hunter' ? 'caçador' : 'assassino'} ${p.hit.why}.`, 'gold');
      Progress.diary(`${k === 'hunter' ? '🎯' : '🗡️'} Você matou ${People.full(p)}, de ${People.homeName(p)}, ${k === 'hunter' ? 'que caçava a recompensa pela sua cabeça' : `${p.hit.why}`}.`);
      if (p.home.type === 'village' && typeof Rumors !== 'undefined') Rumors.atV(p.home.idx, `${People.full(p)} saiu para matar ${G.name} por dinheiro e não voltou.`);
    }
  },
};

{
  // os assassinos e os caçadores de recompensa que nasciam como "bandido" agora são pessoas de verdade
  const sp0 = Game.spawn.bind(Game);
  Game.spawn = function (kind, x, y, o) {
    const k = kind === 'bandit' && !Hitmen.busy ? (o && o.tag === 'assassin' ? 'assassin' : Hitmen.mode) : null;
    if (!k) return sp0(kind, x, y, o);
    Hitmen.busy = true;
    try {
      const p = Hitmen.pick(k);
      const e = sp0('villager', x, y, Object.assign({}, o, { npc: p, civ: p.civ, leash: 40 }));
      Hitmen.arm(e, p); Hitmen.say(p);
      return e;
    } catch (err) { console.error(err); return sp0(kind, x, y, o); } finally { Hitmen.busy = false; }
  };
  // caçadores de recompensa (Fora da lei): cada um é uma pessoa, com o nome dela
  if (typeof OutLaw !== 'undefined') {
    const om0 = OutLaw.monthTick.bind(OutLaw);
    OutLaw.monthTick = function (...a) {
      Hitmen.mode = 'hunter';
      try { return om0(...a); } finally { Hitmen.mode = null; for (const e of G.ents) if (!e.dead && e.npc && e.hitman === 'hunter') e.name = People.full(e.npc); }
    };
  }
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function (...a) { const r = mt0(...a); try { Hitmen.monthTick(); } catch (e) { console.error(e); } return r; };
  const die0 = People.die.bind(People);
  People.die = function (p, cause, ...a) { try { Hitmen.died(p, cause); } catch (e) { console.error(e); } return die0(p, cause, ...a); };
}
