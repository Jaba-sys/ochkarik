/* ============================================================
   ОЧКАРИК · интерфейс страницы игры
   Только этот модуль трогает DOM комнаты.
   ============================================================ */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

window.UI = {
  el: {},
  ok: false,

  bind() {
    const ids = ['clock','nightN','diffLbl','barSleep','barPanic','barBatt','cue','phone','door','silh',
      'slitEl','lids','dream','wakeBtn','red','scare','newAch','newAchName','cSleep','cPhone','cDoor',
      'distEl','trackEl','trackDot','tsub','battTxt','phClock','resTitle','resNight','resWhy','resStats',
      'resNext','resRetry','pauseSheet','result','menuBtn'];
    ids.forEach(id => this.el[id] = $(id));
    this.ok = !!this.el.clock;
    return this.ok;
  },

  sheet(id, on) { const n = $(id); if (n) n.classList.toggle('on', on); },

  /* --- сброс комнаты --- */
  resetRoom() {
    const e = this.el;
    e.door.classList.remove('shut', 'knock');
    e.phone.classList.remove('up', 'off');
    e.lids.classList.remove('shut');
    e.dream.classList.remove('on');
    e.wakeBtn.classList.remove('on');
    e.scare.classList.remove('on');
    e.slitEl.classList.remove('bright', 'flick');
    e.red.style.opacity = 0;
    e.silh.style.opacity = 0;
    e.silh.style.width = '38%';
    e.cue.classList.remove('on');
    this.sheet('result', false);
    this.sheet('pauseSheet', false);
  },

  door(shut)   { this.el.door.classList.toggle('shut', shut); },
  phoneUp(up)  { this.el.phone.classList.toggle('up', up); },
  phoneDead(d) { this.el.phone.classList.toggle('off', d); },
  eyes(shut)   {
    this.el.lids.classList.toggle('shut', shut);
    this.el.dream.classList.toggle('on', shut);
    this.el.wakeBtn.classList.toggle('on', shut);
  },
  silhouette(on, grow) {
    this.el.silh.style.opacity = on ? .85 : 0;
    if (on && grow != null) this.el.silh.style.width = (38 + grow * 34) + '%';
    if (!on) this.el.silh.style.width = '38%';
  },
  slit(bright) { this.el.slitEl.classList.toggle('bright', bright); },
  flicker() { const s = this.el.slitEl; s.classList.remove('flick'); void s.offsetWidth; s.classList.add('flick'); },
  knock()   { const d = this.el.door; d.classList.remove('knock'); void d.offsetWidth; d.classList.add('knock'); },

  cue(text) {
    const c = this.el.cue;
    c.textContent = text;
    c.classList.add('on');
    clearTimeout(this._cueT);
    this._cueT = setTimeout(() => c.classList.remove('on'), 2300);
  },

  buttons(G) {
    this.el.cSleep.classList.toggle('act', G.sleeping);
    this.el.cSleep.firstElementChild.textContent = G.sleeping ? 'Проснуться' : 'Спать';
    this.el.cPhone.classList.toggle('act', G.phone);
    this.el.cDoor.classList.toggle('act', G.door);
    this.el.cDoor.firstElementChild.textContent = G.door ? 'Открыть' : 'Дверь';
  },

  hud(G) {
    const e = this.el;
    const mins = Math.floor(G.t / G.c.dur * 360);
    e.clock.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    this.bar(e.barSleep, G.sleep, G.sleep < 26 ? '#c22a3a' : '#9ff0d8');
    this.bar(e.barPanic, G.panic, G.panic > 70 ? '#ff5566' : '#c22a3a');
    this.bar(e.barBatt,  G.batt,  G.batt < 15 ? '#c22a3a' : '#f2b33d');
  },
  bar(node, v, color) {
    node.style.setProperty('--v', clamp(v, 0, 100) + '%');
    node.style.setProperty('--c', color);
  },

  tracker(G) {
    const e = this.el;
    const d = Math.round(G.dist);
    const near = (G.phase === 'in' || d < 60) && !G.faking;
    if (G.phase === 'in' && !G.faking) e.distEl.innerHTML = '<span class="inflat">В КВАРТИРЕ</span>';
    else if (G.faking) e.distEl.innerHTML = Math.round(G.fakeDist) + ' <small>М</small>';
    else e.distEl.innerHTML = d + ' <small>М</small>';
    e.distEl.classList.toggle('warn', near);
    e.trackEl.classList.toggle('warn', near);
    e.trackDot.style.left = clamp((G.faking ? G.fakeDist : G.dist) / 1250 * 100, 0, 100) + '%';
    e.tsub.textContent = G.faking ? 'СИГНАЛ ПЛЯШЕТ'
      : G.phase === 'in' ? 'ЗА ТВОЕЙ ДВЕРЬЮ'
      : d < 60 ? 'ПОДЪЕЗД' : d < 200 ? 'ВО ДВОРЕ' : 'В ПУТИ';
    e.battTxt.textContent = 'БАТАРЕЯ ' + Math.max(0, Math.round(G.batt)) + '%';
    e.phClock.textContent = '03:' + String(12 + Math.floor(G.t / G.c.dur * 180)).padStart(2, '0');
  },

  danger(v) { this.el.red.style.opacity = v * .95; },
  scare(on) { this.el.scare.classList.toggle('on', on); },

  popAch(name) {
    if (!this.el.newAch) return;
    this.el.newAchName.textContent = name;
    this.el.newAch.classList.add('on');
    Snd.ping();
    clearTimeout(this._achT);
    this._achT = setTimeout(() => this.el.newAch.classList.remove('on'), 2600);
  },

  result(G, reason, texts) {
    const win = !reason;
    this.el.resTitle.textContent = win ? '6:00' : 'ОН НАШЁЛ ТЕБЯ';
    this.el.resTitle.classList.toggle('bad', !win);
    this.el.resNight.textContent = 'НОЧЬ ' + G.n + ' · ' + G.c.diff.label;
    this.el.resWhy.textContent = win
      ? 'Ты дожил до утра. За окном светло, и в квартире никого.'
      : texts[reason];
    this.el.resStats.innerHTML = [
      ['Отогнан',    G.repelled + ' раз'],
      ['Проспал',    Math.round(G.slept) + ' с'],
      ['Пик паники', Math.round(G.maxPanic) + '%'],
      ['Телефон',    G.phoneUses + ' раз'],
      ['Батарея',    Math.max(0, Math.round(G.batt)) + '%'],
      ['Впустую',    G.wasted + ' закр.']
    ].map(s => '<div class="stat"><b>' + s[1] + '</b><span>' + s[0].toUpperCase() + '</span></div>').join('');
    this.el.resNext.textContent = win ? 'Ночь ' + (G.n + 1) : 'Ещё раз';
    this.el.resNext.dataset.n = win ? G.n + 1 : G.n;
    this.el.resNext.dataset.chain = win ? G.chain + 1 : 1;
    this.el.resRetry.hidden = !win;
    this.el.resRetry.dataset.n = G.n;
    this.sheet('result', true);
  }
};
