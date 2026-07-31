const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `app.get("/api/database/export", async (req, res) => {
  const os = require('os');
  const tempPath = require('path').join(os.tmpdir(), \`hypermarket_export_\${Date.now()}.duckdb\`);
  
  try {
    await db.exec("FORCE CHECKPOINT;");
  } catch (e) {
    console.error("Checkpoint failed before export:", e);
  }
  
  try {
    console.log("Copying database file to temp path:", tempPath);
    require('fs').copyFileSync(dbPath, tempPath);
    
    res.download(tempPath, \`hypermarket_backup_\${new Date().getTime()}.db\`, (err) => {
      try { if (require('fs').existsSync(tempPath)) require('fs').unlinkSync(tempPath); } catch (e) {}
    });
  } catch(e) {
    console.error("Failed to copy database for export:", e);
    try { if (require('fs').existsSync(tempPath)) require('fs').unlinkSync(tempPath); } catch (err) {}
    res.status(500).json({ error: "خطا در تهیه نسخه پشتیبان" });
  }
});`;

content = content.replace(/app\.get\("\/api\/database\/export"[\s\S]*?res\.status\(500\)\.json\({ error: "خطا در تهیه نسخه پشتیبان" }\);\n        \n        try {\n        db = await Database\.create\(dbPath\);\n        await initDbSchema\(db\);\n    } catch\(e2\) {\n        console\.error\("Failed to re-initialize DB after failed export:", e2\);\n    }\n  }\n}\);/, replacement);

fs.writeFileSync('server.ts', content);
