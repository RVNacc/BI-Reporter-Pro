const fs = require('fs');
const files = fs.readdirSync('src/views').filter(f => f.endsWith('.tsx')).map(f => 'src/views/' + f);
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('setData') && !content.includes('data?.error') && !content.includes('data.error')) {
    content = content.replace(/  return \(\s*<div/, '  if (data?.error) return <div className="p-10 text-center text-red-500">{data.error}</div>;\n  return (\n    <div');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched ' + file);
  }
}
