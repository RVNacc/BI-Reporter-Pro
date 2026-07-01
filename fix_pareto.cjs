const fs = require('fs');

let pUI = fs.readFileSync('src/views/ParetoReportsView.tsx', 'utf8');
pUI = pUI.replace(`const [period, setPeriod] = useState("");`, `const [period, setPeriod] = useState("");\n  const [netMode, setNetMode] = useState(true);`);
pUI = pUI.replace(`fetch(\`/api/reports/pareto?period=\${period}&intervalSettings=\${encodeURIComponent(intervalSettings)}\`)`, `fetch(\`/api/reports/pareto?period=\${period}&netMode=\${netMode}&intervalSettings=\${encodeURIComponent(intervalSettings)}\`)`);
fs.writeFileSync('src/views/ParetoReportsView.tsx', pUI);
