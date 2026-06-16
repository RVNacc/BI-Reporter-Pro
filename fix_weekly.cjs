const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    const aggregated: Record<string, { l1: string, l2: string, ac: string, weeksAmt: Record<number, number>, weeksQty: Record<number, number> }> = {};`;

const replacement = `    const aggregated: Record<string, { l1: string, l2: string, ac: string, weeksAmt: Record<number, number>, weeksQty: Record<number, number> }> = {};
    const prodAgg: Record<string, { name: string, code: string, weeksAmt: Record<number, number>, weeksQty: Record<number, number> }> = {};`;

s = s.replace(targetStr, replacement);

const targetStr2 = `        if (!aggregated[key]) {
            aggregated[key] = { l1: pInfo.l1, l2: pInfo.l2, ac: pInfo.ac, weeksAmt: {}, weeksQty: {} };
        }
        aggregated[key].weeksAmt[row.week] = (aggregated[key].weeksAmt[row.week] || 0) + amt;
        aggregated[key].weeksQty[row.week] = (aggregated[key].weeksQty[row.week] || 0) + qty;`;

const replacement2 = `        if (!aggregated[key]) {
            aggregated[key] = { l1: pInfo.l1, l2: pInfo.l2, ac: pInfo.ac, weeksAmt: {}, weeksQty: {} };
        }
        aggregated[key].weeksAmt[row.week] = (aggregated[key].weeksAmt[row.week] || 0) + amt;
        aggregated[key].weeksQty[row.week] = (aggregated[key].weeksQty[row.week] || 0) + qty;
        
        if (!prodAgg[code]) {
            prodAgg[code] = { name: pInfo.name, code, weeksAmt: {}, weeksQty: {} };
        }
        prodAgg[code].weeksAmt[row.week] = (prodAgg[code].weeksAmt[row.week] || 0) + amt;
        prodAgg[code].weeksQty[row.week] = (prodAgg[code].weeksQty[row.week] || 0) + qty;`;

s = s.replace(targetStr2, replacement2);

const targetStr3 = `    res.json({ weeks: weeksHeaders, rows: resultRows.sort((a,b) => (a.l1 || "").localeCompare(b.l1 || "") || (a.l2 || "").localeCompare(b.l2 || "")) });`;

const replacement3 = `
    const movers: any[] = [];
    if (maxWeek > 1) {
       for (const code in prodAgg) {
          const p = prodAgg[code];
          const curAmt = p.weeksAmt[maxWeek] || 0;
          const prevAmt = p.weeksAmt[maxWeek - 1] || 0;
          const diffAmt = curAmt - prevAmt;
          
          const curQty = p.weeksQty[maxWeek] || 0;
          const prevQty = p.weeksQty[maxWeek - 1] || 0;
          const diffQty = curQty - prevQty;
          
          if (diffAmt !== 0 || diffQty !== 0) {
             movers.push({ name: p.name, code: p.code, diffAmt, curAmt, prevAmt, diffQty, curQty, prevQty });
          }
       }
    }
    const topGrowersAmt = [...movers].sort((a,b) => b.diffAmt - a.diffAmt).slice(0, 50);
    const topDeclinersAmt = [...movers].sort((a,b) => a.diffAmt - b.diffAmt).slice(0, 50);
    const topGrowersQty = [...movers].sort((a,b) => b.diffQty - a.diffQty).slice(0, 50);
    const topDeclinersQty = [...movers].sort((a,b) => a.diffQty - b.diffQty).slice(0, 50);

    res.json({ 
       weeks: weeksHeaders, 
       rows: resultRows.sort((a,b) => (a.l1 || "").localeCompare(b.l1 || "") || (a.l2 || "").localeCompare(b.l2 || "")),
       movers: { topGrowersAmt, topDeclinersAmt, topGrowersQty, topDeclinersQty }
    });`;

s = s.replace(targetStr3, replacement3);

fs.writeFileSync('server.ts', s);
