const duckdb = require('duckdb');
const db = new duckdb.Database('hypermarket.duckdb', (err) => {
    if (err) throw err;
    db.exec("ATTACH 'temp_backup.duckdb' AS backup;", (err) => {
        if(err) console.error("Attach error", err);
        else {
            db.exec("CREATE TABLE backup.t1 AS SELECT * FROM files LIMIT 1;", (err) => {
                 if(err) console.error("Copy error", err);
                 else console.log("Copied!");
            });
        }
    });
});
