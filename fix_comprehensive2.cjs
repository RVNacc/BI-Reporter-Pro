const fs = require('fs');
let code = fs.readFileSync('src/views/ComprehensiveProfitLossView.tsx', 'utf8');

code = code.replace(
    /<ExportPrintButtons data=\{filteredData\} fileName="سود_و_زیان_جامع" \/>/,
    '<ExportPrintButtons data={data} fileName="سود_و_زیان_جامع" />'
);

fs.writeFileSync('src/views/ComprehensiveProfitLossView.tsx', code);
console.log('done');
