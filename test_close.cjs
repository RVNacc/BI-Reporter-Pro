const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
console.log(typeof db.close);
if(db.close) {
    db.close((err) => {
       console.log("Closed", err);
    });
}
