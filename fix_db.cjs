const { Database } = require('duckdb-async');
const path = require('path');
(async () => {
  const dbPath = path.join(process.cwd(), "hypermarket.duckdb");
  const db = await Database.create(dbPath);
  
  // Find bad dates
  const badDates = await db.all(`
    SELECT id, json_extract_string(data, '$.date') as bad_date 
    FROM raw_data 
    WHERE json_extract_string(data, '$.date') IS NOT NULL 
      AND length(json_extract_string(data, '$.date')) < 10
  `);
  console.log("Bad dates found:", badDates.length);
  
  for (const row of badDates) {
     if (row.bad_date) {
        const m = row.bad_date.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
        if (m) {
           const fixedDate = `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}`;
           // Wait, modifying json is tricky in DuckDB.
           // We can just replace the date string inside the JSON string since we know the exact value.
           // But actually json_extract returns the value.
           await db.run(`UPDATE raw_data SET data = regexp_replace(data, '"date"\s*:\s*"' || ? || '"', '"date":"' || ? || '"') WHERE id = ?`, row.bad_date, fixedDate, row.id);
        }
     }
  }
  console.log("Fixed");
})();
