const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all combinations of TRY_CAST, TRY_TRY_CAST, etc. back to clean forms
while (code.includes('TRY_TRY_CAST')) {
    code = code.replace(/TRY_TRY_CAST/g, 'TRY_CAST');
}
while (code.includes('TRY_CAST(REPLACE(json_extract_string(data, \'TRY_CAST(REPLACE(')) {
    // Oh boy, the regex messed up the inside string too.
    // Let's just fix it systematically.
    break;
}
