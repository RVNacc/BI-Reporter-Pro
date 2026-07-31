const fs = require('fs');
let code = fs.readFileSync('src/views/ComprehensiveProfitLossView.tsx', 'utf8');

code = code.replace(
  "const json = await res.json();",
  "const json = await res.json();\n      if (!Array.isArray(json)) throw new Error('Not an array');"
);

code = code.replace(
  "setData(json);",
  "setData(json);"
);

code = code.replace(
  "console.error(e);",
  "console.error(e);\n      setData([]);"
);

fs.writeFileSync('src/views/ComprehensiveProfitLossView.tsx', code);
console.log('Fixed view');
