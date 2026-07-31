const fs = require('fs');
let code = fs.readFileSync('src/views/ComprehensiveProfitLossView.tsx', 'utf8');

code = code.replace(
    /\{\s*loading\s*\?\s*\(\s*<p>در حال بارگذاری...<\/p>\s*\)\s*:\s*\(\s*<div className="flex justify-between items-center mb-4">/,
    '{loading ? (\n        <p>در حال بارگذاری...</p>\n      ) : (\n        <>\n        <div className="flex justify-between items-center mb-4">'
);

code = code.replace(
    /<\/table>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>/,
    '</table>\n            </div>\n        </>\n      )}\n    </div>'
);

fs.writeFileSync('src/views/ComprehensiveProfitLossView.tsx', code);
console.log('done');
