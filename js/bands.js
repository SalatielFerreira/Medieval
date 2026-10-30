'use strict';
// Bandidos de verdade: os bandos dos acampamentos, os que emboscam as caravanas e o exército anarquista não surgem do nada.
// Cada bando tem os seus membros, pessoas com nome, família, personalidade e vida própria:
//  • quem entra para um bando é um morador pobre e de mau gênio da região, que largou a vila e foi viver no mato (a vila
//    fica sabendo), ou um forasteiro que chega para isso;
//  • quem escapa de uma luta volta no próximo ataque (os rostos são os mesmos); o bando só recruta quando alguém morre;
//  • matar um bandido é legítima defesa (não é crime), mas a família dele lamenta.
// Os ladrões que roubam o caixa dos seus empreendimentos também são pessoas: o jogo diz quem foi e o dinheiro fica com ele.
// Bandos em G.urban.bands = { chave: [ids] } (camp<n>, amb, anarch<reino>, wild); família dos forasteiros de cada bando
// em G.urban.bandFam.
if (!RANKS.bandit) RANKS.bandit = { m: 'Bandido', f: 'Bandida', order: 9 };
if (!RANK_LOOK.bandit) RANK_LOOK.bandit = '#3b2b2b';
const BAND_FROM = { beggar: 3, wanderer: 3, peasant: 1, hunter: 2, mercenary: 2, sailor: 1 };

const Bands = {
  S() { const u = G.urban || (G.urban = {}); u.bands = u.bands || {}; u.bandFam = u.bandFam || {}; return u; },
  key(o) {
    if (o && o.camp) { const i = World.camps.indexOf(o.camp); return i >= 0 ? 'camp' + i : 'wild'; }
    const t = (o && o.tag) || '';
    if (t.startsWith('amb')) return 'amb';
    if (t === 'anarch') { const ci = World.terr[World.idx(Math.floor(P.x / TILE), Math.floor(P.y / TILE))]; return 'anarch' + (ci >= 0 ? ci : ''); }
    return 'wild';
  },
  members(k) { const S = this.S(); return (S.bands[k] || []).map(id => G.people[id]).filter(p => p && p.alive); },
  free(p) { const e = G.spawned.get(p.id); return !(e && !e.dead); },
  // quem largaria tudo para viver no mato
  fit(p) {
    if (!p.alive || p.age < 17 || p.age > 50 || p.kin || p.capanga || p.spouse === 'player' || p.band || p.hit) return false;
    if (!BAND_FROM[p.rank] || p.shop || (p.job !== undefined && p.job !== null) || p.port || p.trip || People.isCourt(p) || p.home.type !== 'village') return false;
    const f = Families.of(p); if (f && (f.player || f.noble)) return false;
    return p.aff < 10 && this.free(p);
  },
  // um morador da região (perto de onde o bando age) entra para o bando
  recruit(k, x, y) {
    let best = null, bs = -1;
    for (const p of G.people) {
      if (!this.fit(p)) continue;
      const v = World.villages[p.home.idx]; if (!v) continue;
      const d = U.dist(v.x, v.y, x / TILE, y / TILE); if (d > 70) continue;
      const t = TRAITS[p.trait] || {};
      const s = BAND_FROM[p.rank] + (t.fights ? 2 : 0) + (p.trait === 'ganancioso' ? 1.5 : 0) + (p.aff < -20 ? 1 : 0) - d / 40 + Math.random() * 2;
      if (s > bs) { bs = s; best = p; }
    }
    if (!best || Math.random() < 0.45) return null; // nem sempre alguém da vila topa: muitas vezes chega gente de fora
    const vi = best.home.idx, v = World.villages[vi];
    best.band = k; best.bandFrom = vi; best.rank = 'bandit'; best.home = { type: 'wild' }; best.hostile = true;
    if (v && typeof Rumors !== 'undefined') Rumors.atV(vi, `${People.full(best)} largou tudo em ${v.name} e foi viver no mato com os bandidos.`);
    return best;
  },
  // um forasteiro chega para o bando (os de fora de um mesmo bando são parentes: o bando é de uma família)
  stranger(k) {
    const S = this.S(), f = S.bandFam[k] !== undefined ? Families.get(S.bandFam[k]) : null;
    const p = People.create(Object.assign({ rank: 'bandit', home: { type: 'wild' }, age: U.rint(18, 46), sex: Math.random() < 0.8 ? 'm' : 'f', trait: U.pick(['ganancioso', 'orgulhoso', 'rabugento', 'desconfiado', 'corajoso'].filter(t => TRAITS[t])) }, f ? { fam: f.id } : {}));
    if (!f) S.bandFam[k] = p.fam;
    p.band = k; p.hostile = true; p.aff = Math.min(p.aff || 0, -10);
    return p;
  },
  // quem vai para a luta: um membro que está livre ou alguém novo
  member(o, x, y) {
    const k = this.key(o), S = this.S(), list = S.bands[k] || (S.bands[k] = []);
    S.bands[k] = list.filter(id => G.people[id] && G.people[id].alive);
    const back = this.members(k).find(p => this.free(p));
    if (back) return back;
    const p = this.recruit(k, x, y) || this.stranger(k);
    S.bands[k].push(p.id);
    return p;
  },
  // o ladrão do caixa: um bandido da região ou um morador pobre perto do empreendimento
  thief(s) {
    const near = this.members('wild').concat(...Object.keys(this.S().bands).filter(k => k.startsWith('camp')).map(k => this.members(k)));
    let pool = near.filter(p => this.free(p));
    if (!pool.length || Math.random() < 0.5) {
      const vi = typeof Work !== 'undefined' ? Work.vi(s) : -1;
      const poor = vi >= 0 ? G.people.filter(p => p.alive && p.home.type === 'village' && p.home.idx === vi && ['beggar', 'wanderer', 'peasant'].includes(p.rank) && p.age >= 16 && !p.kin && !p.capanga && p.spouse !== 'player' && p.aff < 30) : [];
      if (poor.length) pool = poor;
    }
    return pool.length ? U.pick(pool) : this.stranger('wild');
  },
  // o roubo do caixa: o ladrão fica com o dinheiro e a vila fica sabendo; devolve quem foi (para a mensagem)
  rob(s, loss) {
    const t = this.thief(s);
    t.purse = People.purse(t) + loss; t.stole = (t.stole || 0) + loss; t.aff = Math.min(t.aff || 0, -15);
    const vi = typeof Work !== 'undefined' ? Work.vi(s) : -1;
    if (vi >= 0 && typeof Rumors !== 'undefined') Rumors.atV(vi, `Dizem que foi ${People.full(t)} quem limpou o caixa do ${BUILDINGS[s.type].name}.`);
    return `${People.full(t)} (${People.title(t).toLowerCase()}${t.band ? '' : `, de ${People.homeName(t)}`})`;
  },
};

{
  // todo bandido que aparece é uma pessoa do bando (os assassinos e caçadores de recompensa ficam com hitmen.js)
  const sp0 = Game.spawn.bind(Game);
  Game.spawn = function (kind, x, y, o) {
    if (kind !== 'bandit' || (o && o.npc) || (o && o.tag === 'assassin') || (typeof Hitmen !== 'undefined' && (Hitmen.mode || Hitmen.busy))) return sp0(kind, x, y, o);
    try {
      const p = Bands.member(o, x, y);
      const e = sp0(kind, x, y, Object.assign({}, o, { npc: p }));
      p.hostile = true; p.met = true; G.spawned.set(p.id, e);
      return e;
    } catch (err) { console.error(err); return sp0(kind, x, y, o); }
  };
}
