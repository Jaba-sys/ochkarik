/* ============================================================
   ОЧКАРИК · общий запуск
   Один и тот же файл работает на всех страницах: делает только то,
   для чего на текущей странице есть разметка.
   ============================================================ */
(function () {
  const hasGame = window.UI && UI.bind && UI.bind();

  /* --- навигация по ссылкам data-go --- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    e.preventDefault();
    if (window.Snd) Snd.init();
    const go = b.dataset.go;
    if (go === 'menu') { if (window.Game && Game.G) Game.stop(); Router.go('menu'); }
    else if (go === 'start') Router.go('game', { night: 1, chain: 1 });
    else if (go === 'cont')  Router.go('game', { night: Save.data.cont, chain: 1 });
    else Router.go(go);
  });

  /* --- сложность --- */
  document.querySelectorAll('.dbtn').forEach(b => {
    b.addEventListener('click', () => {
      Save.data.diff = b.dataset.diff;
      Save.persist();
      Pages.menu();
      if (window.Snd) { Snd.init(); Snd.latch(); }
    });
  });

  const wipe = document.getElementById('wipe');
  if (wipe) wipe.addEventListener('click', () => { Save.reset(); Pages.menu(); Pages.ach(); });

  /* --- страница игры --- */
  if (hasGame) {
    UI.el.cSleep .addEventListener('click', () => Game.toggleSleep());
    UI.el.cPhone .addEventListener('click', () => Game.togglePhone());
    UI.el.cDoor  .addEventListener('click', () => Game.toggleDoor());
    UI.el.wakeBtn.addEventListener('click', () => Game.toggleSleep());
    UI.el.menuBtn.addEventListener('click', () => Game.pause());

    UI.el.resNext .addEventListener('click', () =>
      Game.start(+UI.el.resNext.dataset.n, null, +UI.el.resNext.dataset.chain));
    UI.el.resRetry.addEventListener('click', () =>
      Game.start(+UI.el.resRetry.dataset.n, null, 1));

    const pr = document.getElementById('pauseResume');
    const pa = document.getElementById('pauseAgain');
    if (pr) pr.addEventListener('click', () => Game.resume());
    if (pa) pa.addEventListener('click', () => {
      const n = Game.G ? Game.G.n : 1;
      UI.sheet('pauseSheet', false);
      Game.stop();
      Game.start(n, null, 1);
    });

    addEventListener('keydown', e => {
      if (e.repeat) return;
      if (e.code === 'Space')  { e.preventDefault(); Game.toggleSleep(); }
      if (e.code === 'KeyE')   Game.togglePhone();
      if (e.code === 'KeyQ')   Game.toggleDoor();
      if (e.code === 'Escape') { Game.paused ? Game.resume() : Game.pause(); }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && Game.G && !Game.G.over) Game.pause();
    });
  }

  /* --- старт после загрузки прогресса --- */
  Save.load().then(() => {
    Pages.menu();
    Pages.ach();

    Router.on('menu', () => Pages.menu());
    Router.on('ach',  () => Pages.ach());
    Router.on('game', startNight);

    if (hasGame && Router.current() === 'game') startNight();
  });

  function startNight() {
    const p = Session.takePending() || { night: 1, chain: 1 };
    Game.start(p.night || 1, p.diff || Save.data.diff, p.chain || 1);
  }
})();
