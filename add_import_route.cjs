const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');

// Check if we need to add import route
if (!s.includes('app.post("/api/database/import"')) {
    const importRoute = `
// Import Database
app.post("/api/database/import", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "فایلی ارسال نشده است." });
    }
    
    // Close existing DB
    db.close();
    
    // Replace the database file
    fs.copyFileSync(req.file.path, dbPath);
    
    // Delete temp file
    fs.unlinkSync(req.file.path);
    
    // Re-initialize DB
    db = new Database(dbPath);
    
    // Re-register functions
    db.function('isInPeriod', (dateStr, periodStr) => {
      if (!periodStr) return 1;
      if (!dateStr || typeof dateStr !== 'string') return 0;
      
      const [pType, pValue] = periodStr.split(':');
      if (pType === 'Y') return dateStr.startsWith(pValue) ? 1 : 0;
      if (pType === 'Q') {
          const [y, q] = pValue.split('-Q');
          if (!dateStr.startsWith(y)) return 0;
          const month = parseInt(dateStr.split('/')[1]);
          const qNum = parseInt(q);
          const startMonth = (qNum - 1) * 3 + 1;
          const endMonth = qNum * 3;
          if (month >= startMonth && month <= endMonth) return 1;
          return 0;
      }
      if (pType === 'M') {
          return dateStr.startsWith(pValue) ? 1 : 0;
      }
      return 1;
    });

    res.json({ message: "پایگاه داده با موفقیت بازیابی شد." });
  } catch (err: any) {
    console.error("Database Import Error:", err);
    res.status(500).json({ error: "خطا در بازیابی پایگاه داده." });
  }
});
`;

    s = s.replace(`// Export Database\napp.get("/api/database/export", (req, res) => {\n  res.download(dbPath, \`hypermarket_backup_\${new Date().getTime()}.db\`);\n});`, `// Export Database\napp.get("/api/database/export", (req, res) => {\n  res.download(dbPath, \`hypermarket_backup_\${new Date().getTime()}.db\`);\n});\n${importRoute}`);
    
    fs.writeFileSync('server.ts', s);
}
