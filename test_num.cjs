const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
db.all("CREATE TABLE t (val NUMERIC); INSERT INTO t VALUES (1.5); SELECT val FROM t;", (err, res) => {
    console.log(typeof res[0].val, res[0].val);
});
