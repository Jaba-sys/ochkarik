/* ============================================================
   ОЧКАРИК · сохранение
   window.storage (артефакт) → localStorage → память.
   Данные подписаны контрольной суммой: если файл сохранения
   правили руками, достижения сбрасываются, а не принимаются на веру.
   ============================================================ */
window.Save = {
  KEY: 'ochkarik:v3',
  data: { ach: [], best: 0, cont: 1, diff: 'normal', bestDiff: {}, runs: 0 },
  loaded: false,

  /* Короткая контрольная сумма. Не криптография — защита от правки в один клик. */
  sign(obj) {
    const s = JSON.stringify([obj.ach, obj.best, obj.cont, obj.bestDiff, obj.runs]);
    let h = 0x1f2e3d;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return (h >>> 0).toString(36);
  },

  async load() {
    let raw = null;
    try { const r = await window.storage.get(this.KEY); if (r && r.value) raw = r.value; } catch (e) {}
    if (raw === null) { try { raw = localStorage.getItem(this.KEY); } catch (e) {} }
    if (raw) {
      try {
        const p = JSON.parse(raw);
        const sig = p.sig; delete p.sig;
        if (sig === this.sign(p)) Object.assign(this.data, p);
        else { this.data.diff = p.diff || 'normal'; this.data.tampered = true; }
      } catch (e) {}
    }
    this.loaded = true;
    return this.data;
  },

  async persist() {
    const copy = Object.assign({}, this.data);
    delete copy.tampered;
    copy.sig = this.sign(copy);
    const raw = JSON.stringify(copy);
    try { await window.storage.set(this.KEY, raw); } catch (e) {}
    try { localStorage.setItem(this.KEY, raw); } catch (e) {}
  },

  reset() {
    const diff = this.data.diff;
    this.data = { ach: [], best: 0, cont: 1, diff: diff, bestDiff: {}, runs: 0 };
    this.persist();
  }
};

/* ------------------------------------------------------------
   Сессия: что меню передаёт странице игры.
   Живёт отдельно от прогресса и не подписывается — это не награда.
   ------------------------------------------------------------ */
window.Session = {
  KEY: 'ochkarik:pending',
  setPending(p) { try { sessionStorage.setItem(this.KEY, JSON.stringify(p)); } catch (e) { this._p = p; } },
  takePending() {
    let p = this._p || null;
    try { const r = sessionStorage.getItem(this.KEY); if (r) p = JSON.parse(r); } catch (e) {}
    this._p = null;
    try { sessionStorage.removeItem(this.KEY); } catch (e) {}
    return p;
  }
};
