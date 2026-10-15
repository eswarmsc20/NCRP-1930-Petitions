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

// 2. Synchronize all HTML files from public/ to root with relative paths
const htmlFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));

for (const htmlFile of htmlFiles) {
  let content = fs.readFileSync(path.join(PUBLIC_DIR, htmlFile), 'utf-8');
  content = content.replace(/href="\/css\//g, 'href="./css/');
  content = content.replace(/src="\/js\//g, 'src="./js/');
  content = content.replace(/src="\/images\//g, 'src="./images/');

  fs.writeFileSync(path.join(ROOT_DIR, htmlFile), content);
  fs.writeFileSync(path.join(PUBLIC_DIR, htmlFile), content);
  console.log(`Synchronized ${htmlFile} to root.`);
}

console.log('Synchronized root files for GitHub Pages compatibility.');
