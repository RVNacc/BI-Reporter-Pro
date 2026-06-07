const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const customFuncStr = `
// Custom function for checking date periods
db.function('isInPeriod', (dateStr, periodStr) => {
  if (!periodStr) return 1;
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const match = dateStr.match(/(\\d{4})[\\/-](\\d{1,2})([\\/-](\\d{1,2}))?/);
  if (!match) {
     return dateStr.includes(periodStr) ? 1 : 0;
  }
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const mStr = m.toString().padStart(2, '0');
  
  if (periodStr.startsWith('Y:')) {
     return periodStr.substring(2) === y.toString() ? 1 : 0;
  }
  if (periodStr.startsWith('Q:')) {
     const parts = periodStr.substring(2).split('-Q');
     return (parseInt(parts[0]) === y && Math.ceil(m/3) === parseInt(parts[1])) ? 1 : 0;
  }
  if (periodStr.startsWith('M:')) {
     return periodStr.substring(2) === \`\${y}/\${mStr}\` ? 1 : 0;
  }
  
  return dateStr.includes(periodStr) ? 1 : 0;
});
`;

if (!content.includes('isInPeriod')) {
   content = content.replace(
     /const db = new Database[^\n]+\n/g,
     match => match + customFuncStr + '\n'
   );
}

const p1 = /AND \(\? = '' OR json_extract\(data, '\$\.date'\) LIKE '%' \|\| \? \|\| '%'\)/g;
content = content.replace(p1, "AND isInPeriod(json_extract(data, '$.date'), ?) = 1");

content = content.replace(/\.all\(period, period\)/g, ".all(period)");
content = content.replace(/\.get\(period, period\)/g, ".get(period)");
content = content.replace(/\.iterate\(period, period\)/g, ".iterate(period)");
content = content.replace(/\.get\(modType, period, period\)/g, ".get(modType, period)");

const periodApiRegex = /app\.get\("\/api\/periods", \(req, res\) => \{[\s\S]*?\}\);/g;

const newPeriodApi = `app.get("/api/periods", (req, res) => {
  try {
    const dates = db
      .prepare(
        "SELECT DISTINCT json_extract(data, '$.date') as d FROM raw_data WHERE json_extract(data, '$.date') IS NOT NULL"
      )
      .all()
      .map((r: any) => r.d)
      .filter((d: any) => d && typeof d === 'string');

    const parsed = dates.map(d => {
       const match = d.match(/(\\d{4})[\\/-](\\d{1,2})([\\/-](\\d{1,2}))?/);
       if (match) {
          return {
             orig: d,
             y: parseInt(match[1], 10),
             m: parseInt(match[2], 10),
             d: match[4] ? parseInt(match[4], 10) : 1
          }
       }
       return null;
    }).filter(x => x);

    const yearMonths = new Set<string>();
    const years = new Set<string>();
    const seasons = new Set<string>();
    
    parsed.forEach((p: any) => {
       const yStr = p.y.toString();
       const mStr = p.m.toString().padStart(2, '0');
       yearMonths.add(\`\${yStr}/\${mStr}\`);
       years.add(yStr);
       const quarter = Math.ceil(p.m / 3);
       seasons.add(\`\${yStr}-Q\${quarter}\`);
    });

    const options = [{ value: "", label: "همه دوره‌ها" }];
    
    Array.from(years).sort().reverse().forEach(y => {
       options.push({ value: \`Y:\${y}\`, label: \`سال \${y}\` });
    });
    
    Array.from(seasons).sort().reverse().forEach(s => {
       const parts = (s as string).split('-Q');
       const seasonNames = ['بهار', 'تابستان', 'پاییز', 'زمستان']; 
       options.push({ value: \`Q:\${s}\`, label: \`\${seasonNames[parseInt(parts[1])-1] || 'فصل '+parts[1]} \${parts[0]}\` });
    });

    Array.from(yearMonths).sort().reverse().forEach(ym => {
       const parts = (ym as string).split('/');
       options.push({ value: \`M:\${ym}\`, label: \`ماه \${parts[1]} سال \${parts[0]}\` });
    });

    res.json(options);
  } catch (err) {
    res.json([{ value: "", label: "همه دوره‌ها" }]);
  }
});`;

content = content.replace(periodApiRegex, newPeriodApi);

fs.writeFileSync('server.ts', content);
