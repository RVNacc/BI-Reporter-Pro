const duckdb = require('duckdb');
const db = new duckdb.Database('hypermarket.duckdb');
db.exec("ATTACH 'temp_backup.duckdb' AS backup;", (err) => {
    if(err) console.error("Attach error", err);
    db.exec("COPY FROM DATABASE memory TO backup;", (err) => {
         if(err) console.error("Copy error", err);
         else console.log("Copied!");
    });
});
