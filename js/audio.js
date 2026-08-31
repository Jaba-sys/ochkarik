/* ============================================================
   ОЧКАРИК · звук
   Всё синтезируется на лету, никаких файлов.
   ============================================================ */
window.Snd = {
  ctx: null,
  ready: false,
  ambient: null,

  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.ready = true; }
      catch (e) { this.ready = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  /* --- примитивы --- */
  tone(f, d, type, g, to, delay) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), v = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + d);
    v.gain.setValueAtTime(0, t);
    v.gain.linearRampToValueAtTime(g == null ? .2 : g, t + .012);
    v.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(v).connect(this.ctx.destination);
    o.start(t); o.stop(t + d + .06);
  },

  noise(d, freq, g, q, delay, type) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * d));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const v = this.ctx.createGain(); v.gain.value = g == null ? .2 : g;
    s.connect(f).connect(v).connect(this.ctx.destination);
    s.start(t);
  },

  /* --- фоновый гул квартиры --- */
  startAmbient() {
    if (!this.ctx || this.ambient) return;
    const o = this.ctx.createOscillator(), v = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 47;
    f.type = 'lowpass'; f.frequency.value = 140;
    v.gain.value = .022;
    o.connect(f).connect(v).connect(this.ctx.destination);
    o.start();
    this.ambient = { o, v };
  },
  stopAmbient() {
    if (!this.ambient) return;
    try { this.ambient.o.stop(); } catch (e) {}
    this.ambient = null;
  },

  /* --- события --- */
  door(shut)   { this.tone(shut ? 150 : 220, .16, 'square', .05, shut ? 70 : 150); this.noise(.2, 900, .05); },
  latch()      { this.tone(1800, .04, 'square', .04); },
  enter()      { this.tone(58, 1.2, 'sine', .3, 32); this.noise(.55, 320, .14, .7);
                 this.noise(.32, 180, .1, 1, .28); },
  scream()     { this.tone(880, .9, 'sawtooth', .15, 130); this.noise(.85, 1500, .11, .6);
                 this.tone(640, .5, 'square', .07, 90, .2); },
  jump()       { this.noise(1.5, 700, .34, .4); this.tone(120, 1.3, 'sawtooth', .22, 40); },
  beat()       { this.tone(52, .16, 'sine', .22, 30); this.tone(46, .14, 'sine', .12, 28, .19); },
  ping()       { this.tone(1400, .09, 'triangle', .06); this.tone(2100, .07, 'triangle', .04, null, .09); },
  win()        { [392, 523, 659, 784].forEach((f, i) => this.tone(f, .42, 'triangle', .11, null, i * .13)); },
  alarm()      { for (let i = 0; i < 4; i++) this.tone(880, .1, 'square', .09, null, i * .18); },

  /* приближение */
  elevator()   { this.tone(88, 1.6, 'sawtooth', .07, 96); this.noise(1.4, 260, .04, .5); },
  stairs()     { for (let i = 0; i < 4; i++) this.noise(.09, 190 + i * 22, .07, 2, i * .27); },
  creak()      { this.tone(310, .5, 'sawtooth', .045, 190); this.noise(.4, 1200, .03, 3); },
  breath()     { this.noise(.7, 420, .05, .8); this.noise(.5, 300, .035, .9, .8); },
  scratch()    { for (let i = 0; i < 6; i++) this.noise(.05, 2400 + Math.random() * 900, .05, 5, i * .07); },
  knock()      { for (let i = 0; i < 3; i++) this.tone(110, .1, 'square', .12, 60, i * .22); },

  /* обманки */
  fridge()     { this.tone(72, 1.5, 'sine', .05, 68); },
  neighbour()  { this.tone(140, .35, 'square', .035, 120); this.noise(.4, 700, .025); },
  car()        { this.tone(64, 2.2, 'sawtooth', .04, 46); },
  pipes()      { this.tone(240, .8, 'sine', .035, 180); this.noise(.6, 900, .02, 2); },
  wind()       { this.noise(1.8, 380, .05, .4, 0, 'lowpass'); }
};
