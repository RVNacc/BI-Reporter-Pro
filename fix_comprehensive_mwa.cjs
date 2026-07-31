const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/comprehensive-profit", async \(req, res\) => \{[\s\S]*?res\.json\(data\);\s*\}\s*catch[^\}]+\}\s*\n\s*\}\);/m;

const replacement = `app.get("/api/comprehensive-profit", async (req, res) => {
  try {
    const period = (req.query.period || '') as string;
    
    // Fetch all relevant transactions ordered by date and time
    const query = \`
      SELECT 
        f.module_type,
        json_extract_string(data, '$.date') as date,
        json_extract_string(data, '$.time') as time,
        json_extract_string(data, '$.productCode') as code,
        json_extract_string(data, '$.productName') as name,
        TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) as qty,
        TRY_CAST(REPLACE(json_extract_string(data, '$.price'), ',', '') AS REAL) as price,
        TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL) as totalPrice,
        TRY_CAST(REPLACE(json_extract_string(data, '$.discount'), ',', '') AS REAL) as discount,
        TRY_CAST(REPLACE(json_extract_string(data, '$.discountLevel1'), ',', '') AS REAL) as discountLevel1,
        TRY_CAST(REPLACE(json_extract_string(data, '$.discountLevel2'), ',', '') AS REAL) as discountLevel2,
        TRY_CAST(REPLACE(json_extract_string(data, '$.freightCost'), ',', '') AS REAL) as freightCost
      FROM raw_data r JOIN files f ON r.file_id = f.id 
      WHERE f.module_type IN ('opening_inventory', 'purchases', 'purchase_returns', 'sales', 'sales_returns') 
      AND (json_extract_string(data, '$.date') LIKE ? || '%' OR ? = '')
      ORDER BY date ASC, time ASC
    \`;
    const rows = await db.all(query, period, period) as any[];

    const inventory: Record<string, { qty: number, totalCost: number, name: string }> = {};
    const salesStats: Record<string, { salesQty: number, netSales: number, cogs: number, name: string }> = {};

    for (const r of rows) {
      if (!r.code) continue;
      const code = r.code;
      const name = r.name || code;
      const qty = r.qty || 0;
      const price = r.price || 0;
      const discount = (r.discount || 0) + (r.discountLevel1 || 0) + (r.discountLevel2 || 0);
      const freightCost = r.freightCost || 0;
      
      let baseTotal = r.totalPrice !== null ? r.totalPrice : (qty * price);
      let netValue = baseTotal - discount;

      if (!inventory[code]) inventory[code] = { qty: 0, totalCost: 0, name };
      if (!salesStats[code]) salesStats[code] = { salesQty: 0, netSales: 0, cogs: 0, name };

      let inv = inventory[code];
      let stat = salesStats[code];

      // MWA calculation
      let currentUnitCost = inv.qty > 0 ? inv.totalCost / inv.qty : 0;

      if (r.module_type === 'opening_inventory') {
        inv.qty += qty;
        inv.totalCost += netValue;
      } else if (r.module_type === 'purchases') {
        inv.qty += qty;
        inv.totalCost += (netValue + freightCost);
      } else if (r.module_type === 'purchase_returns') {
        inv.qty -= qty;
        inv.totalCost -= (qty * currentUnitCost);
      } else if (r.module_type === 'sales') {
        inv.qty -= qty;
        inv.totalCost -= (qty * currentUnitCost);
        
        stat.salesQty += qty;
        stat.netSales += netValue;
        stat.cogs += (qty * currentUnitCost);
      } else if (r.module_type === 'sales_returns') {
        inv.qty += qty;
        inv.totalCost += (qty * currentUnitCost);
        
        stat.salesQty -= qty;
        stat.netSales -= netValue;
        stat.cogs -= (qty * currentUnitCost);
      }
    }

    const data = Object.keys(salesStats).map(code => {
      const s = salesStats[code];
      const currentUnitCost = inventory[code].qty > 0 ? inventory[code].totalCost / inventory[code].qty : 0;
      return {
        code,
        name: s.name,
        salesQty: s.salesQty,
        netSales: s.netSales,
        cogs: s.cogs, // Exact COGS calculated per transaction using MWA
        unitCost: currentUnitCost, // For reference
        profit: s.netSales - s.cogs,
        marg: s.netSales > 0 ? ((s.netSales - s.cogs) / s.netSales) * 100 : 0
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching comprehensive profit:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive profit' });
  }
});`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log('Fixed comprehensive MWA logic');
