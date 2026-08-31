/* ============================================================
   ОЧКАРИК · сборка одностраничной версии
   node build.js  →  dist/ochkarik.html
   Собирает четыре страницы в один файл: разметка страниц кладётся
   рядом, роутер сам начинает переключать их без перезагрузки.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const PAGES = ['index.html', 'game.html', 'achievements.html', 'help.html'];
const SCRIPTS = ['router', 'storage', 'guard', 'achievements', 'difficulty',
                 'audio', 'ui', 'game', 'pages', 'boot'];

const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const css = read('css/style.css');
const img = 'data:image/png;base64,' +
  fs.readFileSync(path.join(root, 'assets/ochkarik.png')).toString('base64');
const js = SCRIPTS.map(n => read(`js/${n}.js`)).join('\n\n');

const mains = PAGES.map(f => {
  const m = read(f).match(/<main[\s\S]*?<\/main>/);
  if (!m) throw new Error('нет <main> в ' + f);
  return m[0];
}).join('\n\n');

let out = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ОЧКАРИК</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>

${mains}

<script>
${js}
</script>
</body>
</html>
`;

out = out.split('assets/ochkarik.png').join(img);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/ochkarik.html'), out);
console.log(`готово: dist/ochkarik.html (${Math.round(out.length / 1024)} КБ)`);
