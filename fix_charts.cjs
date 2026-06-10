const fs = require('fs');
const files = fs.readdirSync('src/views').filter(f => f.endsWith('.tsx')).map(f => 'src/views/' + f);

function fixContent(content) {
  content = content.replace(/<ResponsiveContainer([^>]*)>\s*<div dir="ltr" className="w-full[^\"]*">\s*(<[A-Za-z]+Chart[\s\S]*?<\/[A-Za-z]+Chart>)\s*<\/div>\s*<\/ResponsiveContainer>/g, '<div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">\n<ResponsiveContainer$1>\n$2\n</ResponsiveContainer>\n</div>');
  content = content.replace(/<ResponsiveContainer([^>]*)>\s*<div[^>]*>\s*(<PieChart[\s\S]*?<\/PieChart>)\s*<\/div>\s*<\/ResponsiveContainer>/gi, '<div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">\n<ResponsiveContainer$1>\n$2\n</ResponsiveContainer>\n</div>');
  return content;
}

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = fixContent(content);
  
  if (newContent !== content) {
    fs.writeFileSync(f, newContent);
    console.log('Fixed', f);
  }
}
