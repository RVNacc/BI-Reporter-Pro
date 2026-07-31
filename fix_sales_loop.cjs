const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLoop = `    for (const s of salesData) {
      if (!s.date) continue;
      const day = getJalaaliWeekday(s.date);
      const isReturn = s.module_type === "sales_returns";
      const q = s.qty || 0;
      const p = s.price || 0;
      let amtBase = 0; if (s.totalPrice != null && !Number.isNaN(s.totalPrice)) { amtBase = s.totalPrice; } else { amtBase = q * p; } const amt = amtBase * (isReturn ? -1 : 1);
      if (weekdayMap[day]) {
        weekdayMap[day].salesAmt += amt;
        if (!isReturn) {
          weekdayMap[day].txCount += 1;
        }
      }
    }`;

const newLoop = `    for (const s of salesData) {
      if (!s.date) continue;
      const day = getJalaaliWeekday(s.date);
      if (weekdayMap[day]) {
        weekdayMap[day].salesAmt += s.totalAmt || 0;
        weekdayMap[day].txCount += s.txCount || 0;
      }
    }`;

code = code.replace(oldLoop, newLoop);
fs.writeFileSync('server.ts', code);
console.log("Sales loop updated");
