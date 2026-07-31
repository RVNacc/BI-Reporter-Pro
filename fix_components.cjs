const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/import ExportButtons from '..\/components\/ExportButtons';/g, "import ExportPrintButtons from '../components/ExportPrintButtons';");
    code = code.replace(/<ExportButtons data={(.+?)} filename="(.+?)" \/>/g, '<ExportPrintButtons data={$1} fileName="$2" />');
    fs.writeFileSync(file, code);
}

fix('src/views/DiscountAnalysisView.tsx');
fix('src/views/ComprehensiveProfitLossView.tsx');
console.log('done');
