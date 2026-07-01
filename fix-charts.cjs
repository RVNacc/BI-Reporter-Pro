const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx')).map(f => path.join(viewsDir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('angle={-90}') || content.includes('margin={')) {
      // Replace XAxis
      content = content.replace(/angle=\{-90\} textAnchor="end"/g, 'angle={-45} textAnchor="start"');
      content = content.replace(/dy: 15, dx: -10/g, 'dy: 15, dx: -15');
      
      // Replace bottom margin in charts
      content = content.replace(/margin=\{\{\s*top:\s*\d+,\s*right:\s*\d+,\s*left:\s*\d+,\s*bottom:\s*\d+\s*\}\}/g, (match) => {
        return match.replace(/bottom:\s*\d+/, 'bottom: 140');
      });
      changed = true;
  }

  // Also increase height of container for bigger bottom margin
  // min-h-[300px] -> min-h-[450px], h-[300px] -> h-[450px], h-[400px] -> h-[450px]
  if (content.includes('h-[300px]') || content.includes('h-[400px]') || content.includes('min-h-[300px]')) {
      content = content.replace(/h-\[300px\]/g, 'h-[450px]');
      content = content.replace(/h-\[400px\]/g, 'h-[450px]');
      content = content.replace(/min-h-\[300px\]/g, 'min-h-[450px]');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log("Done");
