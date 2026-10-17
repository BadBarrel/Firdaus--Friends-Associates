// Battle tab (Adventure, Arena, Tower), team picker and the battle screen.
import * as D from './data.js';
import * as G from './game.js';
import * as B from './battle.js';
import { dragonSVG, stageFor } from './art.js';
import { $, act, view, openSheet, closeSheet, closeAllSheets, refresh, elChip, dragonArt, lockNote, esc } from './ui.js';

const S = () => G.S;
const UNLOCK = { campaign: 1, arena: 4, tower: 8 };

view('battle', () => {
  const lvl = S().player.level;
  const cleared = Object.keys(S().campaign).length;
  const league = D.LEAGUES[G.leagueIndex()];
  const card = (mode, icon, title, desc, status) => {
    const locked = lvl < UNLOCK[mode];
    return `<button class="mode ${locked ? 'locked' : ''}" data-act="mode" data-mode="${mode}" ${locked ? 'disabled' : ''}>
      <span class="mode-icon">${icon}</span>
      <span class="row-main"><b>${title}</b><small>${desc}</small><small class="status">${locked ? lockNote(UNLOCK[mode]) : status}</small></span></button>`;
  };
  return `<h1>Battle</h1>
    ${card('campaign', '🗺️', 'Adventure', `${B.CAMPAIGN_STAGES} stages over ${D.CAMPAIGN_CHAPTERS.length} lands. Earn stars, gold and gems.`, `${cleared}/${B.CAMPAIGN_STAGES} stages cleared`)}
    ${card('arena', '🏟️', 'Arena', 'Fight rival riders, win trophies and climb the leagues.', `${league.icon} ${league.name} · 🏆 ${S().arena.trophies}`)}
    ${card('tower', '🗼', 'Tower of Trials', 'Endless floors that keep getting harder. Gems every 5 floors.', `Best floor: ${S().tower.best}`)}
    <p class="muted small center">Battles won: ${S().stats.won}</p>`;
});

act('mode', (d) => openSheet({ campaign: campaignSheet, arena: arenaSheet, tower: towerSheet }[d.mode]));

// ---------------------------------------------------------------- adventure

function campaignSheet() {
  return `<h2>🗺️ Adventure</h2>
    ${D.CAMPAIGN_CHAPTERS.map((ch, c) => {
      const stages = [];
      for (let i = 0; i < D.STAGES_PER_CHAPTER; i++) {
        const s = c * D.STAGES_PER_CHAPTER + i;
        const open = s === 0 || S().campaign[s - 1];
        const stars = S().campaign[s] || 0;
        const boss = i === D.STAGES_PER_CHAPTER - 1;
        stages.push(`<button class="stage ${boss ? 'boss' : ''} ${stars ? 'done' : ''}" data-act="stage" data-s="${s}" ${open ? '' : 'disabled'}>
          <b>${boss ? '👹' : s + 1}</b><small>${open ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '🔒'}</small></button>`);
      }
      return `<h3>${ch.icon} ${ch.name}</h3><div class="stages">${stages.join('')}</div>`;
    }).join('')}`;
}

act('stage', (d) => {
  const st = B.campaignStage(+d.s);
  openSheet(() => previewSheet(`Stage ${st.stage + 1}${st.boss ? ' · Boss' : ''}`, st.enemies,
    `🪙 ${60 * (st.stage + 1)} · ⭐ XP ${15 * (st.stage + 1)}${S().campaign[st.stage] ? '' : ` · 💎 ${st.boss ? 10 : 3} first clear`}`,
    'campaign', { stage: st.stage, boss: st.boss }));
});

function previewSheet(title, enemies, rewards, mode, info) {
  pending = { mode, info, enemies };
  return `<h2>${title}</h2>
    <h3>Enemy team</h3>
    <div class="cards">${enemies.map((f) => `<div class="dcard static" style="--r:${D.RARITIES[f.sp.rarity].color}">
      ${dragonSVG(f.sp, { stage: stageFor(f.lvl) })}<b>${f.sp.name}</b><small>Lv ${f.lvl} · ${f.sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}</small></div>`).join('')}</div>
    <p class="center">Rewards: ${rewards}</p>
    <button class="btn wide gold" data-act="pick-team">Choose team</button>`;
}

// ---------------------------------------------------------------- arena

let opponents = null;
function arenaBaseLevel() {
  const top = [...S().dragons].sort((a, b) => G.power(b) - G.power(a)).slice(0, 3);
  return Math.max(1, Math.round(top.reduce((s, d) => s + d.lvl, 0) / Math.max(1, top.length)));
}
function arenaSheet() {
  opponents ||= B.arenaOpponents(arenaBaseLevel(), G.leagueIndex());
  const li = G.leagueIndex();
  const next = D.LEAGUES[li + 1];
  return `<h2>🏟️ Arena</h2>
    <p class="center"><b>${D.LEAGUES[li].icon} ${D.LEAGUES[li].name} League</b> · 🏆 ${S().arena.trophies}${next ? `<br><small class="muted">${next.name} at ${next.min} trophies (+💎 ${next.gems})</small>` : ''}</p>
    ${opponents.map((o, i) => `<button class="row" data-act="arena-fight" data-i="${i}">
      <span class="row-icon">${o.diff === 'Easy' ? '🙂' : o.diff === 'Normal' ? '😠' : '😈'}</span>
      <span class="row-main"><b>${o.name}</b><small>${o.diff} · +${o.trophies} 🏆 · ${o.enemies.map((f) => `${f.sp.name} ${f.lvl}`).join(', ')}</small></span></button>`).join('')}
    <button class="btn wide ghost" data-act="arena-refresh">🔄 New opponents</button>
    <p class="muted small">Losing costs 10 trophies.</p>`;
}
act('arena-refresh', () => {
  opponents = null;
  refresh();
});
act('arena-fight', (d) => {
  const o = opponents[+d.i];
  openSheet(() => previewSheet(o.name, o.enemies, `🏆 +${o.trophies} · 🪙 ${200 + 150 * G.leagueIndex()}`, 'arena', { trophies: o.trophies }));
});

// ---------------------------------------------------------------- tower

function towerSheet() {
  const f = S().tower.best + 1;
  const fl = B.towerFloor(f);
  pending = { mode: 'tower', info: { floor: f }, enemies: fl.enemies };
  return `<h2>🗼 Tower of Trials</h2>
    <p class="center">Best floor: <b>${S().tower.best}</b></p>
    <h3>Floor ${f}</h3>
    <div class="cards">${fl.enemies.map((x) => `<div class="dcard static" style="--r:${D.RARITIES[x.sp.rarity].color}">
      ${dragonSVG(x.sp, { stage: stageFor(x.lvl) })}<b>${x.sp.name}</b><small>Lv ${x.lvl}</small></div>`).join('')}</div>
    <p class="center">Rewards: 🪙 ${80 * f} · ⭐ XP ${10 * f}${f % 5 === 0 ? ' · 💎 5' : ''}</p>
    <button class="btn wide gold" data-act="pick-team">Choose team</button>`;
}

// ---------------------------------------------------------------- team picker

let pending = null;
let team = [];

act('pick-team', () => {
  // Fresh copies so a retry starts with full HP.
  pending.enemies = pending.enemies.map((f) => B.fighter(f.sp, f.lvl));
  const best = [...S().dragons].sort((a, b) => G.power(b) - G.power(a));
  team = best.slice(0, 3).map((d) => d.uid);
  openSheet(teamSheet);
});

function teamSheet() {
  const list = [...S().dragons].sort((a, b) => G.power(b) - G.power(a));
  const foe = pending.enemies[0];
  if (!list.length) return '<h2>Your team</h2><p class="muted">You need a dragon first. Hatch your egg in the Hatchery!</p>';
  return `<h2>Your team <small>${team.length}/3</small></h2>
    <p class="muted small">Tap to add or remove. Order = fight order. First enemy: ${foe.sp.elements.map((x) => elChip(x)).join(' ')}</p>
    <div class="cards">${list.map((d) => {
      const pos = team.indexOf(d.uid);
      const sp = D.DRAGONS[d.sp];
      const good = sp.elements.some((x) => D.ELEMENTS[x].strong.includes(foe.sp.elements[0]));
      return `<button class="dcard ${pos >= 0 ? 'picked' : ''}" data-act="team-toggle" data-uid="${d.uid}" style="--r:${D.RARITIES[sp.rarity].color}">
        ${pos >= 0 ? `<span class="pos">${pos + 1}</span>` : ''}${good ? '<span class="good">2×</span>' : ''}
        ${dragonArt(d)}<b>${esc(G.dragonName(d))}</b><small>Lv ${d.lvl} · ${sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}</small></button>`;
    }).join('')}</div>
    <button class="btn wide gold sticky" data-act="fight" ${team.length ? '' : 'disabled'}>⚔️ Fight!</button>`;
}
act('team-toggle', (d) => {
  const uid = +d.uid;
  const i = team.indexOf(uid);
  if (i >= 0) team.splice(i, 1);
  else if (team.length < 3) team.push(uid);
  refresh();
});

// ---------------------------------------------------------------- battle screen

let battle = null;
let busy = false;
let log = '';

act('fight', () => {
  const p = team.map((uid) => B.fighterFromDragon(G.dragonByUid(uid)));
  battle = B.createBattle(p, pending.enemies, pending.mode, pending.info);
  log = `${battle.e[0].name} wants to battle!`;
  busy = false;
  closeAllSheets();
  $('#battle').classList.add('on');
  renderBattle();
});

function hpBar(f) {
  const pct = (f.hp / f.maxHp) * 100;
  return `<div class="hp"><i style="width:${pct}%;background:${pct > 50 ? '#4cd964' : pct > 20 ? '#ffcc00' : '#ff3b30'}"></i></div>
    <small>${f.hp}/${f.maxHp}</small>`;
}
function pips(team, idx) {
  return team.map((f, i) => `<i class="${f.hp === 0 ? 'dead' : i === idx ? 'now' : ''}"></i>`).join('');
}

function renderBattle(result) {
  const b = battle;
  const me = B.active(b, 'p');
  const foe = B.active(b, 'e');
  const moves = me.attacks.map((a, i) => {
    const m = B.multiplier(a.el, foe.sp);
    const e = a.el === 'neutral' ? { icon: '👊', color: '#9e9e9e' } : D.ELEMENTS[a.el];
    return `<button class="move" style="--c:${e.color}" data-act="atk" data-i="${i}" ${a.cd > 0 || busy || b.over ? 'disabled' : ''}>
      <b>${e.icon} ${a.name}</b>
      <small>${a.cd > 0 ? `⏳ ${a.cd}` : m > 1 ? '🔥 Strong!' : m < 1 ? '🛡️ Weak' : `Power ${a.power}×`}</small></button>`;
  }).join('');
  $('#battle').innerHTML = `<div class="bt">
    <div class="bt-top"><div class="pips">${pips(b.e, b.ei)}</div><button class="btn ghost small" data-act="forfeit">Run away</button></div>
    <div class="bt-side foe">
      <div class="bt-card"><b>${esc(foe.name)}</b> <small>Lv ${foe.lvl}</small><div>${foe.sp.elements.map((x) => elChip(x, false)).join('')}</div>${hpBar(foe)}</div>
      <div class="bt-art" id="art-e">${dragonSVG(foe.sp, { stage: stageFor(foe.lvl) })}</div>
    </div>
    <div class="bt-log">${log}</div>
    <div class="bt-side me">
      <div class="bt-art" id="art-p">${dragonSVG(me.sp, { stage: stageFor(me.lvl) })}</div>
      <div class="bt-card"><b>${esc(me.name)}</b> <small>Lv ${me.lvl}</small><div>${me.sp.elements.map((x) => elChip(x, false)).join('')}</div>${hpBar(me)}</div>
    </div>
    <div class="pips mine">${pips(b.p, b.pi)}</div>
    <div class="moves">${moves}</div>
    ${result ? resultPanel(result) : ''}
  </div>`;
}

function resultPanel(r) {
  const won = battle.won;
  const parts = [];
  if (r.gold) parts.push(`🪙 ${G.fmt(r.gold)}`);
  if (r.xp) parts.push(`⭐ ${G.fmt(r.xp)} XP`);
  if (r.gems) parts.push(`💎 ${r.gems}`);
  if (r.trophies) parts.push(`🏆 ${r.trophies > 0 ? '+' : ''}${r.trophies}`);
  const nextTower = battle.mode === 'tower' && won;
  return `<div class="result ${won ? 'win' : 'lose'}">
    <h2>${won ? '🏆 Victory!' : '💀 Defeat'}</h2>
    ${r.stars ? `<p class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</p>` : ''}
    ${r.league ? `<p>Promoted to <b>${r.league}</b> league!</p>` : ''}
    <p>${parts.join(' · ') || 'No rewards this time.'}</p>
    ${won ? '' : '<p class="muted small">Tip: level up your dragons and pick elements strong against the enemy.</p>'}
    ${nextTower ? '<button class="btn wide gold" data-act="tower-next">Next floor ▶</button>' : ''}
    <button class="btn wide ${nextTower ? 'ghost' : 'gold'}" data-act="battle-exit">Continue</button></div>`;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function effectText(evt) {
  let t = '';
  if (evt.crit) t += ' Critical hit!';
  if (evt.mult > 1) t += " It's super effective!";
  if (evt.mult < 1) t += " It's not very effective...";
  return t;
}

async function animate(evt) {
  const atkEl = $(evt.side === 'p' ? '#art-p' : '#art-e');
  const defEl = $(evt.side === 'p' ? '#art-e' : '#art-p');
  atkEl?.classList.add('lunge');
  await wait(220);
  if (defEl) {
    defEl.classList.add('hit');
    const n = document.createElement('span');
    n.className = 'dmg' + (evt.mult > 1 ? ' strong' : evt.mult < 1 ? ' weak' : '');
    n.textContent = `-${evt.dmg}`;
    defEl.appendChild(n);
  }
  await wait(650);
}

async function turn(i) {
  if (busy || !battle || battle.over) return;
  busy = true;
  const me = B.active(battle, 'p');
  const evt = B.attack(battle, 'p', i);
  if (!evt) {
    busy = false;
    return;
  }
  log = `${esc(me.name)} used ${evt.attack.name}!${effectText(evt)}`;
  renderBattle();
  await animate(evt);
  if (evt.fainted) {
    log = `${esc(evt.foeName)} fainted!`;
    renderBattle();
    await wait(700);
    if (battle.over) return end();
    log = `${esc(B.active(battle, 'e').name)} steps in!`;
    renderBattle();
    await wait(500);
  }
  const foe = B.active(battle, 'e');
  const evt2 = B.attack(battle, 'e', B.enemyChoice(battle));
  log = `${esc(foe.name)} used ${evt2.attack.name}!${effectText(evt2)}`;
  renderBattle();
  await animate(evt2);
  if (evt2.fainted) {
    log = `${esc(evt2.foeName)} fainted!`;
    renderBattle();
    await wait(700);
    if (battle.over) return end();
    log = `Go, ${esc(B.active(battle, 'p').name)}!`;
  } else {
    log = 'Choose an attack!';
  }
  busy = false;
  renderBattle();
}
act('atk', (d) => turn(+d.i));

function end() {
  busy = false;
  const r = G.recordBattle(battle.mode, { won: battle.won, info: battle.info, fainted: B.faintedCount(battle) });
  if (battle.mode === 'arena') opponents = null;
  log = battle.won ? 'You won the battle!' : 'Your team was defeated.';
  renderBattle(r);
}

act('forfeit', () => {
  if (battle.over || !confirm('Run away? This counts as a loss.')) return;
  battle.over = true;
  battle.won = false;
  end();
});

act('battle-exit', () => {
  battle = null;
  $('#battle').classList.remove('on');
  $('#battle').innerHTML = '';
  refresh();
});

act('tower-next', () => {
  const f = S().tower.best + 1;
  const fl = B.towerFloor(f);
  pending = { mode: 'tower', info: { floor: f }, enemies: fl.enemies };
  battle = null;
  $('#battle').classList.remove('on');
  $('#battle').innerHTML = '';
  const best = [...S().dragons].sort((a, b) => G.power(b) - G.power(a));
  team = team.filter((uid) => G.dragonByUid(uid));
  if (!team.length) team = best.slice(0, 3).map((d) => d.uid);
  refresh();
  openSheet(teamSheet);
});

export const inBattle = () => !!battle;
