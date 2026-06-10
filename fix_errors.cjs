const fs = require('fs');

const dir = 'src/views';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => dir + '/' + f);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add fetch fix: res.json() without .ok check
  // Actually let's just patch the component rendering!
  
  if (content.includes('if (!data)') && !content.includes('data?.error') && !content.includes('data.error')) {
    content = content.replace('if (!data)', 'if (data?.error) return <div className="p-10 text-center text-red-500">{data.error}</div>;\n  if (!data)');
    changed = true;
  }
  
  if (content.includes('if (!data && !loading)') && !content.includes('data?.error') && !content.includes('data.error')) {
      content = content.replace('if (!data && !loading)', 'if (data?.error) return <div className="p-10 text-center text-red-500">{data.error}</div>;\n  if (!data && !loading)');
      changed = true;
  }

  // Same for loading || !data
  if (content.match(/if \(loading \|\| !data\)/) && !content.includes('data?.error') && !content.includes('data.error')) {
      content = content.replace(/if \(loading \|\| !data\)/, 'if (data?.error) return <div className="p-10 text-center text-red-500">{data.error}</div>;\n  if (loading || !data)');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched ' + file);
  }
}
