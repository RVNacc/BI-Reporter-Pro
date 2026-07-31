const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
db.all("CREATE TABLE t (id INTEGER); INSERT INTO t VALUES (1); SELECT id FROM t;", (err, res) => {
    console.log(typeof res[0].id, res[0].id);
    try {
        JSON.stringify(res);
        console.log("Stringify OK");
    } catch(e) {
        console.log("Stringify Error:", e.message);
    }
});
