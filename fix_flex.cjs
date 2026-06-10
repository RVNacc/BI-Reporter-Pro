const fs = require('fs');
const files = fs.readdirSync('src/views').filter(f => f.endsWith('.tsx')).map(f => 'src/views/' + f);

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  // Find all instances of className="h-[...] ..." or className="h-96 ..."
  // inside div elements that immediately precede an h4 and a Chart div wrapper
  // We can just add " flex flex-col" to any div that has a specific height like "h-96" or "h-[450px]" and contains a <ResponsiveContainer
  
  // A safer regex: find `<div className="h-...` that contains `text-center font-bold text-sm` which is the h4 header we've been seeing for charts
  
  content = content.replace(/className="((?:h-\[[0-9]+px\]|h-[0-9]+)(?: [^"]*)?)">(\s*<h4)/g, (match, classes, nextElement) => {
    if (!classes.includes('flex flex-col')) {
      return `className="${classes} flex flex-col">${nextElement}`;
    }
    return match;
  });

  // Also replace h-[450px] specifically matching the border rounded-xl
  content = content.replace(/className="(h-\[[0-9]+px\]|h-[0-9]+) ([^"]*border[^"]*p-4[^"]*)"/g, (match, hClass, restClasses) => {
     if (!restClasses.includes('flex flex-col') && !restClasses.includes('flex-col')) {
         return `className="${hClass} flex flex-col ${restClasses}"`;
     }
     return match;
  });

  // Make sure PieChart wrapper div is also correctly formatted
  content = content.replace(/<ResponsiveContainer width="100%" height="80%">/g, '<div dir="ltr" className="w-full flex-1 min-h-0 min-w-0 flex items-center justify-center">\n<ResponsiveContainer width="100%" height="100%">');
  content = content.replace(/height="80%">\s*<PieChart>[\s\S]*?<\/PieChart>\s*<\/ResponsiveContainer>/g, '$&</div>');

  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log('Added flex flex-col to', f);
  }
}
