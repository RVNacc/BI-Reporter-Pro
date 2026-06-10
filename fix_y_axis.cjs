const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Let's completely wipe any <YAxis ... /> that is not type="category" because we want defaultYAxisProps
  // The most reliable regex is to find `<YAxis ` up to the closing `/>` 
  
  content = content.replace(/<YAxis([^>]*)>/g, (match, propsStr) => {
      // Is it a category?
      if (propsStr.includes("verticalYAxisProps")) return match; 
      if (propsStr.includes('type="category"')) {
         let dk = "";
         let dkMatch = propsStr.match(/dataKey="([^"]+)"/);
         if (dkMatch) dk = dkMatch[1];
         return `<YAxis dataKey="${dk}" {...verticalYAxisProps} />`;
      }
      
      let side = '{...defaultYAxisProps}';
      if (propsStr.includes('yAxisId="right"')) side = 'yAxisId="right" {...defaultYAxisProps}';
      if (propsStr.includes('yAxisId="left"')) side = 'yAxisId="left" {...defaultYAxisProps} orientation="left"';

      return `<YAxis ${side} />`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed YAxis in', file);
  }
}
