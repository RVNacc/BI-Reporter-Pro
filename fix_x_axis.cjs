const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/views');
const files = fs.readdirSync(dir);

for (const f of files) {
   if (!f.endsWith('.tsx')) continue;
   const fullPath = path.join(dir, f);
   let content = fs.readFileSync(fullPath, 'utf8');
   
   content = content.replace(/textAnchor="start"/g, 'textAnchor="end"');
   content = content.replace(/dy:\s*10/g, 'dy: 15, dx: -10');
   
   fs.writeFileSync(fullPath, content);
}
console.log("Replaced XAxis in views");
