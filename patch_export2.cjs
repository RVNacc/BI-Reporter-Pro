const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/database\/export", async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: "خطا در تهیه نسخه پشتیبان" \}\);\s*\}\s*\}\);/;

const replacement = `app.get("/api/database/export", async (req, res) => {
  const os = require('os');
  const tempPath = path.join(os.tmpdir(), \`hypermarket_export_\${Date.now()}.duckdb\`);
  
  try {
    await db.exec("FORCE CHECKPOINT;");
  } catch (e) {
    console.error("Checkpoint failed before export:", e);
  }
  
  try {
    console.log("Closing database for export...");
    await db.close();
    
    // Give OS a moment to release locks
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Copying database file to temp path:", tempPath);
    fs.copyFileSync(dbPath, tempPath);
    
    // Re-initialize DB
    db = await Database.create(dbPath);
    await initDbSchema(db);
    
    res.download(tempPath, \`hypermarket_backup_\${new Date().getTime()}.db\`, (err) => {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
    });
  } catch(e) {
    console.error("Failed to copy database for export:", e);
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (err) {}
    res.status(500).json({ error: "خطا در تهیه نسخه پشتیبان" });
    
    try {
        db = await Database.create(dbPath);
        await initDbSchema(db);
    } catch(e2) {
        console.error("Failed to reopen database after export error:", e2);
    }
  }
});`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
console.log('patched export2');
