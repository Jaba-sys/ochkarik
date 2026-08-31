/* Прогон без браузера: заглушка DOM + проверки защиты достижений.
   Запуск:  node test/smoke.js                                        */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

const IDS = fs.readFileSync(path.join(root, 'game.html'), 'utf8')
  .match(/id="([^"]+)"/g).map(s => s.slice(4, -1));

function node(id) {
  const n = {
    id, _cls: new Set(), style: { setProperty(){}, removeProperty(){} }, dataset: {},
    textContent: '', innerHTML: '', hidden: false, offsetWidth: 1,
    classList: { add: c => n._cls.add(c), remove: c => n._cls.delete(c),
                 toggle: (c, v) => { v ? n._cls.add(c) : n._cls.delete(c); },
                 contains: c => n._cls.has(c) },
    addEventListener(){}, closest(){ return null; }, firstElementChild: { textContent: '' }
  };
  return n;
}
const nodes = {};
IDS.forEach(i => nodes[i] = node(i));

const pageNode = node('page');
pageNode.dataset.page = 'game';
let PAGE = 'game';

global.window = global;
global.document = {
  getElementById: id => nodes[id] || (nodes[id] = node(id)),
  querySelector: sel => (sel.indexOf('[data-page]') === 0 ? pageNode : null),
  querySelectorAll: sel => (sel === '[data-page]' ? [pageNode] : []),
  addEventListener(){}, documentElement: {}
};
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.setTimeout = f => { try { f(); } catch (e) { console.log('таймер:', e.message); } return 0; };
global.clearTimeout = () => {};
global.localStorage = { _v: {}, getItem(k){ return this._v[k] || null; }, setItem(k,v){ this._v[k]=v; } };
global.sessionStorage = { _v: {}, getItem(k){ return this._v[k]||null; }, setItem(k,v){ this._v[k]=v; }, removeItem(k){ delete this._v[k]; } };
global.CustomEvent = function(){};
global.AudioContext = undefined;

['router','storage','guard','achievements','difficulty','audio','ui','game']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), { filename: f + '.js' }));

/* роутер в тесте должен уметь врать про текущую страницу */
Router.current = () => PAGE;
UI.bind();

let fails = 0;
function check(name, cond) {
  console.log((cond ? '  ok  ' : ' ПРОВАЛ ') + name);
  if (!cond) fails++;
}

/* ---------- 1. игра доходит до конца без падений ---------- */
function play(night, diff, policy) {
  Game.start(night, diff, night);
  const G = Game.G, step = 1 / 60;
  let now = 0, guard = 0;
  while (!G.over && guard++ < 60 * 400) {
    now += step * 1000;
    Game.last = now - step * 1000;
    policy(G, Game);
    Game.loop(now);
  }
  return G;
}
const smart = (G, Gm) => {
  if (G.phase === 'in' && !G.door) return Gm.toggleDoor();
  if (G.phase !== 'in' && G.door && G.panic > 25) return Gm.toggleDoor();
  if (!G.sleeping && G.sleep < 45 && G.phase !== 'in') return Gm.toggleSleep();
  if (G.sleeping && G.sleep > 92) return Gm.toggleSleep();
};

console.log('\nИГРА');
const passive = play(1, 'normal', () => {});
check('пассивный игрок умирает', passive.over && !passive.won);
for (const d of ['easy', 'normal', 'nightmare']) {
  const G = play(4, d, smart);
  check(`ночь 4 (${d}) доигрывается: ${G.won ? 'выжил' : 'умер'}, отогнан ${G.repelled}`, G.over);
}

/* ---------- 2. защита достижений ---------- */
console.log('\nЗАЩИТА');
Save.data.ach = [];

const won = play(1, 'normal', smart);
check('за пройденную ночь достижение выдано', Achievements.has('n1'));

Save.data.ach = [];
check('после конца ночи выдача закрыта',
  Achievements.claim('n1', won.token, { won: true, dur: 78, t: 78, chain: 1, repelled: 0, slept: 0 }) === false);

PAGE = 'menu';
Game.start(1, 'normal', 1);
const t = Game.G.token;
check('со страницы меню не выдаётся',
  Achievements.claim('n1', t, { won: true, dur: 78, t: 78, chain: 1, repelled: 0, slept: 0 }) === false);

PAGE = 'game';
check('с чужим токеном не выдаётся',
  Achievements.claim('n1', 'подделка', { won: true, dur: 78, t: 78, chain: 1, repelled: 0, slept: 0 }) === false);
check('с невыполненным условием не выдаётся',
  Achievements.claim('n1', t, { won: false, dur: 78, t: 10, chain: 1, repelled: 0, slept: 0 }) === false);
check('с невозможными цифрами не выдаётся',
  Achievements.claim('nightmare', t, { won: true, diff: 'nightmare', dur: 78, t: 9000, chain: 1, repelled: 0, slept: 0 }) === false);
check('честная заявка проходит',
  Achievements.claim('n1', t, { won: true, dur: 78, t: 78, chain: 1, repelled: 0, slept: 10 }) === true);

/* ---------- 3. подпись сохранения ---------- */
console.log('\nСОХРАНЕНИЕ');
Save.data.ach = ['n1', 'n5'];
Save.persist();
const stored = JSON.parse(localStorage.getItem(Save.KEY));
check('сохранение подписано', typeof stored.sig === 'string');
stored.ach.push('nightmare');
localStorage.setItem(Save.KEY, JSON.stringify(stored));
Save.data = { ach: [], best: 0, cont: 1, diff: 'normal', bestDiff: {}, runs: 0 };
Save.load().then(() => {
  check('правленое сохранение отвергнуто', Save.data.ach.length === 0 && Save.data.tampered === true);
  console.log(fails ? `\nпровалов: ${fails}` : '\nвсё зелёное');
  process.exit(fails ? 1 : 0);
});
