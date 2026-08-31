/* ============================================================
   ОЧКАРИК · игровое ядро
   ============================================================ */
const DEATH = {
  door:  'Он дошёл до кровати. Дверь так и осталась открытой.',
  sleep: 'Глаза больше не держались. Ты отключился не по своей воле — и он вошёл.',
  panic: 'Дверь была закрыта слишком долго. Сердце не выдержало темноты за ней.'
};

/* Обманки: звук плюс подпись. Ни одна не значит опасности. */
const FAKES = [
  { s: 'fridge',    t: '[загудел холодильник]' },
  { s: 'neighbour', t: '[сверху кто-то ходит]' },
  { s: 'car',       t: '[во дворе завелась машина]' },
  { s: 'pipes',     t: '[зашумели трубы]' },
  { s: 'wind',      t: '[в форточку задуло]' },
  { s: 'creak',     t: '[скрипнул шкаф]' }
];

window.Game = {
  G: null, raf: null, last: 0, paused: false,

  start(n, dkey, chain) {
    const c = nightCfg(n, dkey || Save.data.diff);
    this.G = {
      n: n, c: c, chain: chain || 1, token: Guard.openRun(),
      t: 0, sleep: 100, panic: 0, batt: 100,
      dist: c.start, phase: 'far', grace: 0, faking: false, fakeDist: 0, breathed: false,
      sleeping: false, phone: false, door: false, over: false, won: false,
      repelled: 0, phoneUses: 0, wasted: 0, awakeRun: 0, maxAwake: 0, lastFleeGrace: 99,
      slept: 0, maxPanic: 0, minSleep: 100, wasRed: false, hadFake: false, fooled: false,
      beat: 0, nextFake: 4 + Math.random() * 6, cueStairs: false, cueElev: false, knocked: false
    };
    UI.el.nightN.textContent = n;
    UI.el.diffLbl.textContent = c.diff.label;
    UI.resetRoom();
    UI.buttons(this.G);
    this.paused = false;
    Snd.init(); Snd.startAmbient();
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this.loop(t));
  },

  stop() {
    cancelAnimationFrame(this.raf);
    Snd.stopAmbient();
    Guard.seal();
    this.G = null;
    this.paused = false;
  },

  /* ---------------- пауза ---------------- */
  pause() {
    if (!this.G || this.G.over || this.paused) return;
    this.paused = true;
    cancelAnimationFrame(this.raf);
    Snd.stopAmbient();
    UI.sheet('pauseSheet', true);
  },
  resume() {
    if (!this.G || !this.paused) return;
    this.paused = false;
    UI.sheet('pauseSheet', false);
    Snd.init(); Snd.startAmbient();
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.loop(t));
  },

  /* ---------------- действия ---------------- */
  toggleSleep() {
    const G = this.G; if (!G || G.over || this.paused) return;
    Snd.init();
    G.sleeping = !G.sleeping;
    if (G.sleeping) { G.phone = false; UI.phoneUp(false); G.awakeRun = 0; }
    UI.eyes(G.sleeping);
    UI.buttons(G);
  },

  togglePhone() {
    const G = this.G; if (!G || G.over || this.paused) return;
    Snd.init();
    if (G.sleeping) { this.toggleSleep(); return; }
    if (G.batt <= 0 && !G.phone) { Snd.latch(); UI.cue('[телефон не включается]'); return; }
    G.phone = !G.phone;
    if (G.phone) G.phoneUses++;
    UI.phoneUp(G.phone);
    UI.buttons(G);
  },

  toggleDoor() {
    const G = this.G; if (!G || G.over || this.paused) return;
    Snd.init();
    if (G.sleeping) this.toggleSleep();
    G.door = !G.door;
    UI.door(G.door);
    Snd.door(G.door);
    if (G.door) {
      if (G.phase === 'in') this.flee();
      else { G.wasted++; if (G.hadFake) G.fooled = true; Snd.latch(); }
    }
    UI.buttons(G);
  },

  /* ---------------- очкарик ---------------- */
  arrive() {
    const G = this.G;
    G.dist = 0; G.phase = 'in'; G.grace = G.c.grace; G.faking = false; G.knocked = false; G.breathed = false;
    Snd.enter();
    UI.cue('[хлопнула входная дверь]');
    UI.silhouette(true, 0);
    UI.slit(true);
    if (G.door) this.flee();
  },

  flee() {
    const G = this.G;
    G.lastFleeGrace = Math.min(G.lastFleeGrace, G.grace);
    G.repelled++;
    G.phase = 'far';
    G.faking = false;
    /* после бегства он не возвращается мгновенно: минимум ~7 секунд пути */
    G.dist = Math.max((330 + Math.random() * 380) * G.c.diff.returnMul, G.c.speed * 7);
    G.grace = 0;
    G.cueStairs = G.cueElev = false;
    UI.silhouette(false);
    UI.slit(false);
    Snd.scream();
    UI.cue('[он кричит и убегает вниз по лестнице]');
    this.award(['clutch', 'blind', 'x3']);
  },

  /* Факты ночи в том виде, в каком их проверяют правила достижений */
  facts() {
    const G = this.G;
    return {
      won: G.won, n: G.n, chain: G.chain, diff: G.c.diff.key, dur: G.c.dur, t: G.t,
      repelled: G.repelled, phoneUses: G.phoneUses, lastFleeGrace: G.lastFleeGrace,
      maxPanic: G.maxPanic, maxAwake: G.maxAwake, slept: G.slept, minSleep: G.minSleep,
      batt: G.batt, wasRed: G.wasRed, hadFake: G.hadFake, fooled: G.fooled
    };
  },
  award(ids) {
    const f = this.facts();
    ids.forEach(id => Achievements.claim(id, this.G.token, f));
  },

  /* ---------------- цикл ---------------- */
  loop(now) {
    const dt = Math.min(.05, (now - this.last) / 1000);
    this.last = now;
    const G = this.G;
    if (!G || G.over || this.paused) return;
    G.t += dt;

    if (G.sleeping) { G.sleep = clamp(G.sleep + G.c.gain * dt, 0, 100); G.slept += dt; }
    else {
      G.awakeRun += dt;
      G.maxAwake = Math.max(G.maxAwake, G.awakeRun);
      G.sleep = clamp(G.sleep - G.c.drain * (G.phone ? G.c.phoneMul : 1) * dt, 0, 100);
    }
    G.minSleep = Math.min(G.minSleep, G.sleep);

    G.panic = clamp(G.panic + (G.door ? G.c.panicUp : -G.c.panicDn) * dt, 0, 100);
    G.maxPanic = Math.max(G.maxPanic, G.panic);

    G.batt = clamp(G.batt - (G.phone ? G.c.battDrain : G.c.battIdle) * dt, 0, 100);
    if (G.batt <= 0 && G.phone) {
      G.phone = false; UI.phoneUp(false); Snd.latch(); UI.cue('[телефон погас]'); UI.buttons(G);
    }
    UI.phoneDead(G.batt <= 0);

    if (G.c.fakes && !G.sleeping) {
      G.nextFake -= dt;
      if (G.nextFake <= 0) {
        G.nextFake = G.c.fakeRate * (.6 + Math.random() * .9);
        const f = FAKES[Math.floor(Math.random() * FAKES.length)];
        Snd[f.s](); UI.cue(f.t); G.hadFake = true;
        if (Math.random() < .4) UI.flicker();
      }
    }

    if (G.phase === 'far') {
      const slow = G.dist < 70 ? .55 : 1;
      G.dist -= G.c.speed * slow * (.85 + Math.random() * .3) * dt;
      if (G.dist < 220 && !G.cueElev)  { G.cueElev = true;  Snd.elevator(); UI.cue('[поехал лифт]'); }
      if (G.dist < 55  && !G.cueStairs){ G.cueStairs = true; Snd.stairs();  UI.cue('[шаги на лестнице]'); }
      if (G.dist <= 0) this.arrive();
    } else if (G.phase === 'in') {
      G.grace -= dt;
      const p = 1 - G.grace / G.c.grace;
      UI.silhouette(!G.faking, p);
      if (G.c.knocks && !G.knocked && p > .45) { G.knocked = true; Snd.knock(); UI.knock(); UI.cue('[стук в дверь комнаты]'); }
      if (G.c.liar && !G.faking && p > .3 && p < .5 && Math.random() < .02) {
        G.faking = true; G.fakeDist = 90 + Math.random() * 260;
        Snd.stairs(); UI.cue('[шаги удаляются... или нет]'); UI.silhouette(false);
      }
      if (G.grace < .9 && !G.breathed) { G.breathed = true; Snd.breath(); Snd.scratch(); }
      if (G.grace <= 0) return this.die('door');
    }

    const danger = clamp(Math.max((26 - G.sleep) / 26, (G.panic - 72) / 28), 0, 1);
    UI.danger(danger);
    if (danger > .15) G.wasRed = true;
    if (danger > .35) {
      G.beat += dt;
      if (G.beat > Math.max(.3, .9 - danger * .6)) { G.beat = 0; Snd.beat(); }
    }
    if (G.sleep <= 0) return this.die('sleep');
    if (G.panic >= 100) return this.die('panic');

    UI.hud(G);
    if (G.phone) UI.tracker(G);
    if (G.t >= G.c.dur) return this.win();
    this.raf = requestAnimationFrame(t => this.loop(t));
  },

  /* ---------------- финал ---------------- */
  die(reason) {
    const G = this.G;
    G.over = true;
    cancelAnimationFrame(this.raf);
    Snd.stopAmbient();
    Save.data.cont = Math.max(1, Save.data.cont);
    Guard.finishRun();
    Guard.seal();
    if (reason === 'door') {
      UI.scare(true); Snd.jump();
      setTimeout(() => { UI.scare(false); UI.result(G, reason, DEATH); }, 1100);
    } else {
      Snd.jump();
      setTimeout(() => UI.result(G, reason, DEATH), 550);
    }
  },

  win() {
    const G = this.G;
    G.over = true; G.won = true;
    cancelAnimationFrame(this.raf);
    Snd.stopAmbient();
    Snd.win(); Snd.alarm();

    this.award(['n1','n3','n5','n7','calm','owl','sleep','red','lastdrop','deadbatt','nophone','notfooled','nightmare']);
    Guard.finishRun();
    Guard.seal();

    Save.data.best = Math.max(Save.data.best, G.n);
    Save.data.cont = Math.min(G.n + 1, 99);
    Save.data.runs = (Save.data.runs || 0) + 1;
    const bd = Save.data.bestDiff || (Save.data.bestDiff = {});
    bd[G.c.diff.key] = Math.max(bd[G.c.diff.key] || 0, G.n);
    Save.persist();
    UI.result(G, null, DEATH);
  }
};
