const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Copy directory recursively helper
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy css, js, images, data from public/ to root
copyDirSync(path.join(PUBLIC_DIR, 'css'), path.join(ROOT_DIR, 'css'));
copyDirSync(path.join(PUBLIC_DIR, 'js'), path.join(ROOT_DIR, 'js'));
copyDirSync(path.join(PUBLIC_DIR, 'images'), path.join(ROOT_DIR, 'images'));
copyDirSync(path.join(PUBLIC_DIR, 'data'), path.join(ROOT_DIR, 'data'));

// 2. Copy index.html and update paths to relative ./
let indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8');
indexHtml = indexHtml.replace(/href="\/css\//g, 'href="./css/');
indexHtml = indexHtml.replace(/src="\/js\//g, 'src="./js/');
indexHtml = indexHtml.replace(/src="\/images\//g, 'src="./images/');

fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), indexHtml);
fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);

console.log('Synchronized root files for GitHub Pages compatibility.');
