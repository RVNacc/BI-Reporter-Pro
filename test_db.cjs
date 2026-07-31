(async () => {
  try {
    const { Database } = await import('duckdb-async');
    const db = await Database.create(':memory:');
    console.log("Created successfully", !!db);
    await db.close();
    console.log("Closed successfully");
  } catch(e) {
    console.error(e);
  }
})();
