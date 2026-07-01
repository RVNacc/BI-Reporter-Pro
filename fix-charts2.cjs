const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx')).map(f => path.join(viewsDir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('textAnchor="end"')) {
      content = content.replace(/angle=\{-45\} textAnchor="end"/g, 'angle={-45} textAnchor="start"');
      content = content.replace(/angle=\{-90\} textAnchor="end"/g, 'angle={-45} textAnchor="start"');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log("Done");
