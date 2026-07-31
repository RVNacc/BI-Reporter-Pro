const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('DiscountAnalysisView')) {
    code = code.replace("import ProfitLossReportsView from './views/ProfitLossReportsView';", 
                        "import ProfitLossReportsView from './views/ProfitLossReportsView';\nimport DiscountAnalysisView from './views/DiscountAnalysisView';\nimport ComprehensiveProfitLossView from './views/ComprehensiveProfitLossView';");
                        
    const renderSwitch = "case 'files':\n        return <FileManagerView />;";
    const newCases = `case 'files':\n        return <FileManagerView />;\n      case 'discounts':\n        return <DiscountAnalysisView />;\n      case 'comprehensive-profit':\n        return <ComprehensiveProfitLossView />;`;
    
    code = code.replace(renderSwitch, newCases);
    fs.writeFileSync('src/App.tsx', code);
    console.log("App.tsx updated");
}
