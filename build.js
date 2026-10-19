// Builds index.html (student app) and teacher.html (teacher dashboard) from the files in source/.
// Run with: node build.js
const fs = require('fs');
const path = require('path');

const src = f => fs.readFileSync(path.join(__dirname, 'source', f), 'utf8');
const HEAD = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';

function page(shell, scripts) {
  return HEAD + shell + '\n<script>\n' + scripts.map(src).join('\n') + '\n</script>\n</body>\n</html>\n';
}

const shell = src('shell.html');
const teacherShell = shell
  .replace('<title>Sky to Soil Climate PAL</title>', '<title>Sky to Soil Teacher View</title>\n<meta name="robots" content="noindex, nofollow">')
  .replace('Grade 9 · Atmosphere and Climate · PAL', 'Grade 9 · Atmosphere and Climate · Teacher view');

fs.writeFileSync(path.join(__dirname, 'index.html'), page(shell, ['data.js', 'svg.js', 'app.js']));
fs.writeFileSync(path.join(__dirname, 'teacher.html'), page(teacherShell, ['data.js', 'teacher.js']));
console.log('Built index.html and teacher.html');
