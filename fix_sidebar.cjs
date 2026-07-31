const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
code = code.replace('{ id: "discounts", label: "تحلیل تخفیف‌ها",', '{ id: "discounts", label: "حمل و تخفیفات",');
fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Fixed sidebar');
