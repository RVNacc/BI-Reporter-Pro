const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(/CAST\(json_extract\(data, '\$\.quantity'\) AS REAL\) \* CAST\(coalesce\(json_extract\(data, '\$\.totalPrice'\), json_extract\(data, '\$\.price'\), '0'\) AS REAL\)/g, "coalesce(CAST(json_extract(data, '$.totalPrice') AS REAL), CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) * CAST(json_extract(data, '$.price') AS REAL))");

s = s.replace(/CAST\(REPLACE\(json_extract\(data, '\$\.quantity'\), ',', ''\) AS REAL\) \* CAST\(coalesce\(json_extract\(data, '\$\.totalPrice'\), json_extract\(data, '\$\.price'\)\) AS REAL\)/g, "coalesce(CAST(json_extract(data, '$.totalPrice') AS REAL), CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) * CAST(json_extract(data, '$.price') AS REAL))");

fs.writeFileSync('server.ts', s);
