const sqlite3 = require('duckdb');
const db = new sqlite3.Database('hypermarket.duckdb');
db.exec(`
  INSERT INTO files (filename, original_name, module_type) VALUES ('test1', 'test1.xlsx', 'products');
  INSERT INTO raw_data (file_id, data) VALUES (1, '{"productCode":"123","productName":"test"}');
  INSERT INTO files (filename, original_name, module_type) VALUES ('test2', 'test2.xlsx', 'sales');
  INSERT INTO raw_data (file_id, data) VALUES (2, '{"productCode":"123","quantity":"1","price":"100","date":"1402/01/01"}');
`, (err) => {
    if(err) console.error("Insert error", err);
    fetch('http://localhost:3000/api/reports/cost-allocation').then(async r => {
       console.log(r.status);
       console.log(await r.text());
    });
});
