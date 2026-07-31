(async () => {
  const { Database } = await import('duckdb-async');
  const db = await Database.create('hypermarket.duckdb');
  const rows = await db.all("SELECT * FROM raw_data WHERE cost_center IS NOT NULL LIMIT 5");
  console.log(rows);
  await db.close();
})();
