/* Проверка страниц без игрового ядра: меню, достижения, правила.
   На них не подключены ui.js/game.js/difficulty.js — ничего не должно падать.
   Запуск:  node test/pages.js                                              */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

const SCRIPTS = { 'index.html': null, 'achievements.html': null, 'help.html': null };
let fails = 0;
const check = (n, c) => { console.log((c ? '  ok  ' : ' ПРОВАЛ ') + n); if (!c) fails++; };

function scriptsOf(file) {
  return (fs.readFileSync(path.join(root, file), 'utf8').match(/src="js\/([a-z-]+)\.js"/g) || [])
    .map(s => s.slice(8, -4));
}
function idsOf(file) {
  return (fs.readFileSync(path.join(root, file), 'utf8').match(/id="([^"]+)"/g) || []).map(s => s.slice(4, -1));
}
function pageOf(file) {
  return fs.readFileSync(path.join(root, file), 'utf8').match(/data-page="([a-z]+)"/)[1];
}

function run(file) {
  const ids = idsOf(file), page = pageOf(file);
  const mk = id => {
    const n = { id, _cls: new Set(), dataset: {}, style: { setProperty(){} },
      textContent: '', innerHTML: '', hidden: false,
      classList: { add: c => n._cls.add(c), remove: c => n._cls.delete(c),
                   toggle: (c, v) => { v ? n._cls.add(c) : n._cls.delete(c); }, contains: c => n._cls.has(c) },
      addEventListener(){}, closest(){ return null; } };
    return n;
  };
  const nodes = {}; ids.forEach(i => nodes[i] = mk(i));
  const pageNode = mk('page'); pageNode.dataset.page = page;

  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = {
    getElementById: id => nodes[id] || null,
    querySelector: () => pageNode,
    querySelectorAll: sel => (sel === '[data-page]' ? [pageNode] : []),
    addEventListener(){}
  };
  sandbox.addEventListener = () => {};
  sandbox.dispatchEvent = () => {};
  sandbox.location = { href: '' };
  sandbox.localStorage = { getItem: () => null, setItem(){} };
  sandbox.sessionStorage = { getItem: () => null, setItem(){}, removeItem(){} };
  sandbox.setTimeout = f => { f(); return 0; };
  sandbox.clearTimeout = () => {};
  sandbox.Promise = Promise;
  sandbox.JSON = JSON; sandbox.Math = Math; sandbox.Date = Date; sandbox.console = console;
  sandbox.CustomEvent = function(){};
  sandbox.crypto = undefined;
  vm.createContext(sandbox);

  let err = null;
  try {
    scriptsOf(file).forEach(n =>
      vm.runInContext(fs.readFileSync(path.join(root, 'js', n + '.js'), 'utf8'), sandbox, { filename: n + '.js' }));
  } catch (e) { err = e; }

  check(file + ': скрипты выполняются без ошибок' + (err ? ' → ' + err.message : ''), !err);
  check(file + ': страница показана (.on)', pageNode._cls.has('on'));
  return sandbox;
}

console.log('\nСТРАНИЦЫ');
Object.keys(SCRIPTS).forEach(run);

setTimeout(() => {
  console.log(fails ? `\nпровалов: ${fails}` : '\nвсё зелёное');
  process.exit(fails ? 1 : 0);
}, 50);
