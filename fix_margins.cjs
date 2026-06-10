const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Let's replace margin
  content = content.replace(/margin=\{\{[^}]+\}\}/g, 'margin={{ top: 20, right: 30, left: 20, bottom: 20 }}');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed margins in', file);
  }
}
