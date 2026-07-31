const fs = require('fs');
let code = fs.readFileSync('/tmp/CostAllocationView.tsx', 'utf8');
const gridStart = `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
const gridEnd = `{displayCenters.length > chartsPerPage && (`;
console.log(code.indexOf(gridStart));
console.log(code.indexOf(gridEnd));
