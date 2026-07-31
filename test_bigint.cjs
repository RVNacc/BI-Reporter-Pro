const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
db.all("SELECT COUNT(*) as lines", (err, res) => {
    console.log(typeof res[0].lines, res[0].lines);
    try {
        JSON.stringify(res[0]);
        console.log("Stringify OK");
    } catch(e) {
        console.log("Stringify Error:", e.message);
    }
});
