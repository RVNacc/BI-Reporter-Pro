const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add the import statement safely
  if (!content.includes('ChartConfig')) {
    const importStatement = `import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";\n`;
    // finding the last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const newLinePos = content.indexOf('\n', lastImportIndex);
      content = content.substring(0, newLinePos + 1) + importStatement + content.substring(newLinePos + 1);
    } else {
      content = importStatement + content;
    }
  }

  // Horizontal XAxis
  content = content.replace(/<XAxis\s+dataKey="([^"]+)"(?:\s+[^>]+)?\/>/g, (match, dataKey) => {
     if (match.includes('type="number"')) return match;
     if (match.includes('hide')) return match;
     
     // keep specific tickFormatter if it has long text truncation
     let formatter = '';
     let dateMatch = match.match(/tickFormatter=\{([^}]+)\}/);
     if (dateMatch && dateMatch[1].includes('substring')) {
         // wait actually, let's keep tickFormatter if available
         formatter = `tickFormatter={${dateMatch[1]}} `;
     } else if (match.includes('weekName') || dataKey === '"date"' || dataKey === 'date' || dataKey === 'hour') {
        // do nothing special, but let's see if we should override it to match defaultXAxisProps
     }

     return `<XAxis dataKey="${dataKey}" {...defaultXAxisProps} ${formatter} />`;
  });

  // Vertical XAxis (hide number)
  content = content.replace(/<XAxis\s+type="number"[^>]*\/>/g, '<XAxis {...hideAxisProps} />');

  // Vertical YAxis (category)
  content = content.replace(/<YAxis\s+type="category"\s+dataKey="([^"]+)"[^>]*\/>/g, '<YAxis dataKey="$1" {...verticalYAxisProps} />');

  // Horizontal YAxis (number)
  content = content.replace(/<YAxis\s+(?:orientation="right"[^>]*)?\/>/g, '<YAxis {...defaultYAxisProps} />');
  
  // also specifically targeting YAxis that might have other props but we want to reset them to defaultYAxisProps
  content = content.replace(/<YAxis(?:\s+orientation="right")?(?:\s+width=\{[^}]*\})?(?:\s+tickFormatter=\{[^}]*\})?(?:\s+tick=\{[^}]*\})?\s*\/>/g, '<YAxis {...defaultYAxisProps} />');
  content = content.replace(/<YAxis[^\/>]*\/>/g, (match) => {
     if (match.includes('type="category"')) return match;
     if (match.includes('hideAxisProps')) return match; 
     if (match.includes('verticalYAxisProps')) return match;
     if (match.includes('yAxisId="right"')) {
         return `<YAxis yAxisId="right" {...defaultYAxisProps} />`;
     }
     if (match.includes('yAxisId="left"')) {
         return `<YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />`;
     }
     
     // generic replace for YAxis that is purely quantitative
     return `<YAxis {...defaultYAxisProps} />`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', file);
  }
}
