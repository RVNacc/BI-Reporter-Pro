const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    `function extractExcelValue(val: any): string {`,
    `function extractExcelValue(val: any, sharedStrings?: any[]): string {`
);

const oldObjectBlock = `
    if (typeof val === 'object') {
        if (val.result !== undefined) return String(val.result);`;

const newObjectBlock = `
    if (typeof val === 'object') {
        if (val.sharedString !== undefined && sharedStrings) {
             const str = sharedStrings[val.sharedString];
             if (typeof str === 'string') return str;
             if (str && str.richText) return str.richText.map((rt: any) => rt.text).join('');
             if (str && str.text) return str.text;
             if (str === null || str === undefined) return '';
             return String(str);
        }
        if (val.result !== undefined) return String(val.result);`;

code = code.replace(oldObjectBlock, newObjectBlock);

// Replace calls
code = code.replace(/extractExcelValue\(c\)/g, "extractExcelValue(c, (workbookReader as any).sharedStrings)");
code = code.replace(/extractExcelValue\(val\)/g, "extractExcelValue(val, (workbookReader as any).sharedStrings)");

fs.writeFileSync('server.ts', code);
