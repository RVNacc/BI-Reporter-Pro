const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace TRY_TRY_CAST with TRY_CAST
code = code.replace(/TRY_TRY_CAST/g, 'TRY_CAST');
code = code.replace(/TRY_TRY_TRY_CAST/g, 'TRY_CAST');

// Replace the nested mess with proper one
const mess1 = /TRY_CAST\(REPLACE\(json_extract_string\(data, 'TRY_CAST\(REPLACE\(json_extract_string\(data, '\$\.([^']+)'\), ',', ''\) AS REAL\)'\), ',', ''\) AS REAL\)/g;
code = code.replace(mess1, "TRY_CAST(REPLACE(json_extract_string(data, '$.$1'), ',', '') AS REAL)");

// Another mess variant
const mess2 = /TRY_CAST\(REPLACE\(json_extract_string\(data, 'TRY_CAST\(REPLACE\(json_extract_string\(data, '\$\{([^}]+)\}'\), ',', ''\) AS REAL\)'\), ',', ''\) AS REAL\)/g;
code = code.replace(mess2, "TRY_CAST(REPLACE(json_extract_string(data, '${$1}'), ',', '') AS REAL)");

fs.writeFileSync('server.ts', code);
console.log("Cleanup done");
