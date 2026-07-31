const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `    const products = await db.all(\`
      SELECT 
        json_extract_string(data, '$.mainGroup') as mainGroup,
        json_extract_string(data, '$.subGroup') as subGroup
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'
    \`);
    const categories = new Set<string>();
    for (const p of products as any[]) {
      const mg = typeof p.mainGroup === "string" ? p.mainGroup.trim() : "";
      const sg = typeof p.subGroup === "string" ? p.subGroup.trim() : "";
      
      if (mg) categories.add(mg);
      if (mg && sg) categories.add(mg + " - " + sg);
    }`;

content = content.replace(/    const products = await db\.all\([\s\S]*?categories\.add\(mg \+ " - " \+ sg\);\n    }/, replacement);

fs.writeFileSync('server.ts', content);
