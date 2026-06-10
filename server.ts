import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import * as xlsx from "xlsx";
import fs from "fs";
import cors from "cors";
import jalaali from "jalaali-js";

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Set up Multer for Excel file uploads
const upload = multer({ dest: UPLOADS_DIR });

// --- SQLite Database Initialization ---
const dbPath = path.join(process.cwd(), "hypermarket.db");
const db = new Database(dbPath);

// Custom function for checking date periods
db.function('isInPeriod', (dateStr, periodStr) => {
  if (!periodStr) return 1;
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const match = dateStr.match(/(\d{4})[\/-](\d{1,2})([\/-](\d{1,2}))?/);
  if (!match) {
     return dateStr.includes(periodStr) ? 1 : 0;
  }
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const mStr = m.toString().padStart(2, '0');
  
  if (periodStr.startsWith('ADV:')) {
     const pOptions = periodStr.substring(4).split('|');
     
     const parseArr = (str?: string) => str ? str.split(',').map(v => parseInt(v, 10)).filter(v => !isNaN(v)) : null;
     
     const targetYArr = parseArr(pOptions[0]);
     const targetMArr = parseArr(pOptions[1]);
     const targetWArr = parseArr(pOptions[2]);
     const d = match[4] ? parseInt(match[4], 10) : 1;
     
     if (targetYArr && targetYArr.length > 0 && !targetYArr.includes(y)) return 0;
     if (targetMArr && targetMArr.length > 0 && !targetMArr.includes(m)) return 0;
     if (targetWArr && targetWArr.length > 0) {
        const dayOfYear = m <= 6 ? (m - 1) * 31 + d : 186 + (m - 7) * 30 + d;
        const weekOfYear = Math.floor((dayOfYear - 1) / 7) + 1;
        if (!targetWArr.includes(weekOfYear)) return 0;
     }
     return 1;
  }
  
  if (periodStr.startsWith('Y:')) {
     return periodStr.substring(2) === y.toString() ? 1 : 0;
  }
  if (periodStr.startsWith('Q:')) {
     const parts = periodStr.substring(2).split('-Q');
     return (parseInt(parts[0]) === y && Math.ceil(m/3) === parseInt(parts[1])) ? 1 : 0;
  }
  if (periodStr.startsWith('M:')) {
     return periodStr.substring(2) === `${y}/${mStr}` ? 1 : 0;
  }
  
  return dateStr.includes(periodStr) ? 1 : 0;
});

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("temp_store = MEMORY");
db.pragma("cache_size = -64000");
db.pragma("mmap_size = 30000000000");

// Initialize tables
function isDateInPeriod(
  dateStr: string | undefined,
  period: string | undefined,
): boolean {
  if (!period) return true;
  if (!dateStr) return false;

  if (period.startsWith("season:")) {
    const [, year, seasonIdx] = period.split(":");
    const match = dateStr.match(/^(\d{4})[\/-](\d{1,2})/);
    if (!match) return false;
    if (match[1] !== year) return false;

    const month = parseInt(match[2], 10);
    if (seasonIdx === "1" && month >= 1 && month <= 3) return true;
    if (seasonIdx === "2" && month >= 4 && month <= 6) return true;
    if (seasonIdx === "3" && month >= 7 && month <= 9) return true;
    if (seasonIdx === "4" && month >= 10 && month <= 12) return true;
    return false;
  }

  const match = dateStr.match(/^(\d{4})[\/-](\d{1,2})/);
  if (match) {
    const formattedDateStr = `${match[1]}/${match[2].padStart(2, "0")}`;
    const periodNorm = period.includes("/")
      ? `${period.split("/")[0]}/${period.split("/")[1].padStart(2, "0")}`
      : period;

    return formattedDateStr.startsWith(periodNorm);
  }

  return String(dateStr).startsWith(period);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    module_type TEXT NOT NULL,
    row_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS raw_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER,
    data TEXT NOT NULL, -- JSON string of the row
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cost_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    allocation_base TEXT NOT NULL,
    total_cost NUMERIC DEFAULT 0,
    target_categories TEXT DEFAULT '',
    allocation_level TEXT DEFAULT 'level_1'
  );
`);

try {
  db.prepare("ALTER TABLE cost_centers ADD COLUMN allocation_level TEXT DEFAULT 'level_1'").run();
} catch (e) {
  // column might already exist
}

// --- API ROUTES ---

app.use(cors());
app.use(express.json());

// Export Database
app.get("/api/database/export", (req, res) => {
  res.download(dbPath, `hypermarket_backup_${new Date().getTime()}.db`);
});

// 1. Upload Preview API (Step 1)
app.post("/api/upload-preview", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "فایلی آپلود نشد." });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const workbook = xlsx.read(fileBuffer, { type: "buffer", sheetRows: 1 });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Read only first row for headers
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const headers = data[0] || [];

    res.json({
      tempFilename: req.file.filename,
      originalName: req.file.originalname,
      headers,
    });
  } catch (err: any) {
    console.error("Preview Error:", err);
    res.status(500).json({ error: "خطا در پردازش فایل: " + err.message });
  }
});

// 1.5. Upload Commit API (Step 2)
app.post("/api/upload-commit", (req, res) => {
  try {
    const { tempFilename, originalName, module_type, mappings } = req.body;
    const filePath = path.join(UPLOADS_DIR, tempFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "فایل موقت یافت نشد." });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: "buffer", cellDates: true, dense: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });
    const rowCount = data.length;

    const insertFile = db.prepare(
      "INSERT INTO files (filename, original_name, module_type, row_count) VALUES (?, ?, ?, ?)",
    );
    const info = insertFile.run(
      tempFilename,
      originalName,
      module_type,
      rowCount,
    );
    const fileId = info.lastInsertRowid;

    // Use mappings to generate normalized raw_data
    const insertData = db.prepare(
      "INSERT INTO raw_data (file_id, data) VALUES (?, ?)",
    );
    
    // Chunk processing
    const CHUNK_SIZE = 10000;
    const processChunk = db.transaction((chunk: any[]) => {
      for (const row of chunk) {
        const normalizedRow: any = {};
        for (const [sysKey, exKey] of Object.entries(mappings)) {
          if (exKey && row[exKey as string] !== undefined && row[exKey as string] !== null) {
            let val = String(row[exKey as string]).trim();
            if (['quantity', 'price', 'totalPrice', 'costPrice', 'lastPurchasePrice', 'amount', 'vatAmount', 'discount', 'openingBalance', 'volume'].includes(sysKey)) {
                val = val.replace(/,/g, '');
            }
            normalizedRow[sysKey] = val;
          }
        }
        insertData.run(fileId, JSON.stringify(normalizedRow));
      }
    });

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      processChunk(data.slice(i, i + CHUNK_SIZE));
    }

    res.json({ message: "فایل با موفقیت نگاشت و ذخیره شد.", fileId, rowCount });
  } catch (err: any) {
    console.error("Commit Error:", err);
    res.status(500).json({ error: "خطا در نگاشت فایل: " + err.message });
  }
});

// API for extracting periods dynamically
app.get("/api/periods", (req, res) => {
  try {
    const dates = db
      .prepare(
        "SELECT DISTINCT json_extract(data, '$.date') as d FROM raw_data WHERE json_extract(data, '$.date') IS NOT NULL"
      )
      .all()
      .map((r: any) => r.d)
      .filter((d: any) => d && typeof d === 'string');

    const parsed = dates.map(d => {
       const match = d.match(/(\d{4})[\/-](\d{1,2})([\/-](\d{1,2}))?/);
       if (match) {
          return {
             orig: d,
             y: parseInt(match[1], 10),
             m: parseInt(match[2], 10),
             d: match[4] ? parseInt(match[4], 10) : 1
          }
       }
       return null;
    }).filter(x => x);

    const yearMonths = new Set<string>();
    const years = new Set<string>();
    const seasons = new Set<string>();
    
    parsed.forEach((p: any) => {
       const yStr = p.y.toString();
       const mStr = p.m.toString().padStart(2, '0');
       yearMonths.add(`${yStr}/${mStr}`);
       years.add(yStr);
       const quarter = Math.ceil(p.m / 3);
       seasons.add(`${yStr}-Q${quarter}`);
    });

    const options = [{ value: "", label: "همه دوره‌ها" }];
    
    Array.from(years).sort().reverse().forEach(y => {
       options.push({ value: `Y:${y}`, label: `سال ${y}` });
    });
    
    Array.from(seasons).sort().reverse().forEach(s => {
       const parts = (s as string).split('-Q');
       const seasonNames = ['بهار', 'تابستان', 'پاییز', 'زمستان']; 
       options.push({ value: `Q:${s}`, label: `${seasonNames[parseInt(parts[1])-1] || 'فصل '+parts[1]} ${parts[0]}` });
    });

    Array.from(yearMonths).sort().reverse().forEach(ym => {
       const parts = (ym as string).split('/');
       options.push({ value: `M:${ym}`, label: `ماه ${parts[1]} سال ${parts[0]}` });
    });

    res.json(options);
  } catch (err) {
    res.json([{ value: "", label: "همه دوره‌ها" }]);
  }
});


// 2. Dashboard Data (Aggregated from real data)
app.get("/api/dashboard", (req, res) => {
  try {
    const period = (req.query.period as string) || "";

    // Check if we have any data
    const rowCountRecord = db
      .prepare("SELECT COUNT(*) as count FROM raw_data")
      .get() as { count: number };
    if (rowCountRecord.count === 0) {
      return res.json({
        kpis: {
          totalSales: 0,
          netProfitMargin: 0,
          inventoryValue: 0,
          shrinkageRate: 0,
        },
        salesTrend: [],
        paretoData: [],
      });
    }

    // Sales and Monthly Sales Trend
    const salesAgg = db
      .prepare(
        `
      SELECT 
        SUBSTR(json_extract(data, '$.date'), 1, 7) as monthStr,
        SUM(CAST(json_extract(data, '$.quantity') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price'), '0') AS REAL) * CASE WHEN f.module_type = 'sales_returns' THEN -1 ELSE 1 END) as amount
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns')
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
      GROUP BY SUBSTR(json_extract(data, '$.date'), 1, 7)
    `,
      )
      .all(period) as any[];

    const totalSales: number = salesAgg.reduce(
      (acc: number, row: any) => acc + (row.amount || 0),
      0,
    );
    const salesTrend = salesAgg
      .map((row: any) => ({
        name: row.monthStr || "نامشخص",
        value: row.amount || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Product Sales for pareto
    const productSalesAgg = db
      .prepare(
        `
      SELECT 
        coalesce(json_extract(data, '$.productName'), json_extract(data, '$.productCode'), 'نامشخص') as pName,
        SUM(CAST(json_extract(data, '$.quantity') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price'), '0') AS REAL) * CASE WHEN f.module_type = 'sales_returns' THEN -1 ELSE 1 END) as amount
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns')
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
      GROUP BY coalesce(json_extract(data, '$.productName'), json_extract(data, '$.productCode'), 'نامشخص')
      ORDER BY amount DESC LIMIT 10
    `,
      )
      .all(period);

    let cumSum = 0;
    const paretoData = productSalesAgg.map((row: any) => {
      cumSum += Math.max(0, row.amount || 0);
      return {
        name: row.pName,
        value: Math.max(0, row.amount || 0),
        percentage: totalSales > 0 ? (cumSum / totalSales) * 100 : 0,
      };
    });

    const getInvValue = (modType: string) => {
      const res = db
        .prepare(
          `
         SELECT SUM(CAST(json_extract(data, '$.quantity') AS REAL) * CAST(coalesce(json_extract(data, '$.price'), '0') AS REAL)) as val
         FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = ?
         AND isInPeriod(json_extract(data, '$.date'), ?) = 1
       `,
        )
        .get(modType, period) as any;
      return res?.val || 0;
    };

    // Approximate inventory decreases from sales based on purchase price (using sales total minus profit margin roughly or just totalSales if simple)
    // For simplicity preserving the old formula logic:
    let inventoryValue =
      getInvValue("opening_inventory") +
      getInvValue("purchases") -
      getInvValue("purchase_returns") +
      getInvValue("sales_returns") -
      totalSales;

    const finAgg = db
      .prepare(
        `
      SELECT 
        SUM(CASE WHEN json_extract(data, '$.transactionType') LIKE '%خروج%' OR CAST(json_extract(data, '$.amount') AS REAL) < 0 THEN ABS(CAST(json_extract(data, '$.amount') AS REAL)) ELSE 0 END) as outcome,
        SUM(CASE WHEN NOT (json_extract(data, '$.transactionType') LIKE '%خروج%' OR CAST(json_extract(data, '$.amount') AS REAL) < 0) THEN ABS(CAST(json_extract(data, '$.amount') AS REAL)) ELSE 0 END) as income
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance'
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
    `,
      )
      .get(period) as any;

    let profit = (finAgg?.income || 0) - (finAgg?.outcome || 0);

    // Get Top / Bottom selling products and categories for extra cards
    const topProd = db.prepare(`SELECT coalesce(json_extract(data, '$.productName'), json_extract(data, '$.productCode'), 'نامشخص') as name, SUM(CAST(json_extract(data, '$.quantity') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price'), '0') AS REAL) * CASE WHEN f.module_type = 'sales_returns' THEN -1 ELSE 1 END) as amt FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1 GROUP BY name ORDER BY amt DESC LIMIT 1`).get(period) as any;
    
    const botProd = db.prepare(`SELECT coalesce(json_extract(data, '$.productName'), json_extract(data, '$.productCode'), 'نامشخص') as name, SUM(CAST(json_extract(data, '$.quantity') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price'), '0') AS REAL) * CASE WHEN f.module_type = 'sales_returns' THEN -1 ELSE 1 END) as amt FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1 GROUP BY name HAVING amt > 0 ORDER BY amt ASC LIMIT 1`).get(period) as any;

    const topDate = db.prepare(`SELECT json_extract(data, '$.date') as date, SUM(CAST(json_extract(data, '$.quantity') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price'), '0') AS REAL) * CASE WHEN f.module_type = 'sales_returns' THEN -1 ELSE 1 END) as amt FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1 GROUP BY date ORDER BY amt DESC LIMIT 1`).get(period) as any;

    res.json({
      kpis: {
        totalSales,
        netProfitMargin:
          totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : "نامشخص",
        inventoryValue: Math.max(0, inventoryValue),
        shrinkageRate: "نامشخص",
      },
      salesTrend,
      paretoData,
      extremes: { topProd, botProd, topDate }
    });
  } catch (err: any) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: "خطا در پردازش اطلاعات داشبورد" });
  }
});

// 3. Get Uploaded Files List
app.get("/api/files", (req, res) => {
  const files = db
    .prepare("SELECT * FROM files ORDER BY upload_date DESC")
    .all();
  res.json(files);
});

// --- Settings: Cost Centers ---
app.get("/api/cost-centers", (req, res) => {
  const centers = db.prepare("SELECT * FROM cost_centers").all();
  res.json(centers);
});

app.get("/api/product-categories", (req, res) => {
  try {
    const products = db
      .prepare(
        `SELECT data FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'`,
      )
      .iterate();
    const categories = new Set<string>();

    for (const p of products) {
      const parsed = JSON.parse((p as any).data);
      if (parsed.mainGroup) categories.add(parsed.mainGroup.trim());
      if (parsed.subGroup)
        categories.add(
          parsed.mainGroup.trim() + " - " + parsed.subGroup.trim(),
        );
    }

    res.json(Array.from(categories));
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/cost-centers", (req, res) => {
  const { name, allocation_base, total_cost, target_categories, allocation_level } = req.body;
  const insert = db.prepare(
    "INSERT INTO cost_centers (name, allocation_base, total_cost, target_categories, allocation_level) VALUES (?, ?, ?, ?, ?)",
  );
  const info = insert.run(
    name,
    allocation_base,
    total_cost,
    target_categories || "",
    allocation_level || 'level_1'
  );
  res.json({ id: info.lastInsertRowid });
});

app.post("/api/cost-centers/auto-sync", (req, res) => {
  try {
    // Look into raw_data for finance module, aggregate by costCenter, and insert/update cost_centers
    const financeData = db
      .prepare(
        `SELECT data FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance'`,
      )
      .iterate();
    const costsByCenter: Record<string, number> = {};

    for (const row of financeData) {
      const parsed = JSON.parse((row as any).data);
      if (parsed.costCenter && parsed.amount) {
        const center = parsed.costCenter.trim();
        // Convert amount string to number, filter only "خروجی/هزینه" if transactionType exists
        const amount = parseFloat(String(parsed.amount || "").replace(/,/g, ''));
        const tType = parsed.transactionType ? String(parsed.transactionType).trim() : "";
        if (tType && (tType.includes("ورود") || tType.includes("دریافت") || tType.includes("درآمد") || tType.includes("واریز"))) {
            continue; // Skip income/deposits if explicitly marked
        }
        if (!isNaN(amount)) {
          costsByCenter[center] = (costsByCenter[center] || 0) + amount;
        }
      }
    }

    // Update DB
    let added = 0;
    const existing = db
      .prepare("SELECT name FROM cost_centers")
      .all()
      .map((c: any) => c.name);

    const insert = db.prepare(
      "INSERT INTO cost_centers (name, allocation_base, total_cost, target_categories) VALUES (?, ?, ?, ?)",
    );
    const update = db.prepare(
      "UPDATE cost_centers SET total_cost = ? WHERE name = ?",
    );

    db.transaction(() => {
      for (const [center, total] of Object.entries(costsByCenter)) {
        if (existing.includes(center)) {
          update.run(total, center);
        } else {
          insert.run(center, "sales_value", total, "");
          added++;
        }
      }
    })();

    res.json({
      message: "همگام‌سازی موفق",
      syncedCount: Object.keys(costsByCenter).length,
      newAdded: added,
    });
  } catch (err: any) {
    console.error("Sync Error:", err);
    res.status(500).json({ error: "خطا در همگام‌سازی هزینه‌ها" });
  }
});

app.delete("/api/cost-centers/:id", (req, res) => {
  db.prepare("DELETE FROM cost_centers WHERE id = ?").run(req.params.id);
  res.json({ message: "مرکز هزینه حذف شد." });
});

app.put("/api/cost-centers/:id", (req, res) => {
  const { allocation_base, target_categories, allocation_level } = req.body;
  if (allocation_base) {
    db.prepare("UPDATE cost_centers SET allocation_base = ? WHERE id = ?").run(
      allocation_base,
      req.params.id,
    );
  }
  if (target_categories !== undefined) {
    db.prepare(
      "UPDATE cost_centers SET target_categories = ? WHERE id = ?",
    ).run(target_categories, req.params.id);
  }
  if (allocation_level) {
    db.prepare("UPDATE cost_centers SET allocation_level = ? WHERE id = ?").run(
      allocation_level,
      req.params.id,
    );
  }
  res.json({ message: "مرکز هزینه به‌روز شد." });
});

// --- Advanced Reports endpoints ---
app.get("/api/reports/cost-allocation", (req, res) => {
  try {
    // In a real robust scenario with massive data, we'd do complex SQL JOINs on the json data.
    // For now, let's build the report by querying the raw_data table and aggregating in JS
    // which handles JSON properties flexibly.

    // 1. Get all products to build standard categories
    const products = db
      .prepare(
        `
      SELECT 
       json_extract(data, '$.productCode') as code,
       json_extract(data, '$.mainGroup') as mainGrp,
       json_extract(data, '$.subGroup') as subGrp,
       json_extract(data, '$.activityCenter') as ac
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'
    `,
      )
      .iterate();

    // 2 & 3. Get all transactions (Sales, Purchases, Returns)
    const transactions = db
      .prepare(
        `
      SELECT 
       json_extract(data, '$.productCode') as code,
       CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty,
       CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price,
       json_extract(data, '$.invoiceCode') as invCode,
       json_extract(data, '$.receiptCode') as recCode,
       SUBSTR(coalesce(json_extract(data, '$.time'), '12:00'), 1, 2) as hour,
       f.module_type
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'purchases', 'sales_returns', 'purchase_returns')
    `
      )
      .iterate();

    // 5. Get cost centers
    const costCenters = db.prepare("SELECT * FROM cost_centers").all() as any[];

    // Calculate dynamic cost allocation
    const categoryTotals: Record<string, any> = {};
    const productCategoryMap: Record<string, string> = {}; // code -> mainGroup - subGroup
    const autoCenterTargets: Record<string, Set<string>> = {}; // centerName -> Set of mainGroups

    for (const p of products) {
      const row = p as any;
      if (row.code) {
        const l1 = row.mainGrp?.trim() || "نامشخص";
        const l2 = row.subGrp?.trim() || "نامشخص";
        productCategoryMap[row.code] = `${l1}|${l2}`;

        if (row.ac) {
          const ac = row.ac.trim();
          if (!autoCenterTargets[ac]) autoCenterTargets[ac] = new Set();
          autoCenterTargets[ac].add(l1);
        }
      }
    }

    let totalGlobalSales = 0;
    let totalGlobalPurchases = 0;

    for (const t of transactions) {
      const row = t as any;
      const code = row.code;
      const catKey = productCategoryMap[code] || "سایر|سایر";
      if (!categoryTotals[catKey])
        categoryTotals[catKey] = {
          salesAmt: 0, purchaseAmt: 0, salesRetAmt: 0, pRetAmt: 0,
          qtySales: 0, qtyPurchase: 0, qtySalesRet: 0, qtyPRet: 0,
          sInvoices: new Set(), pInvoices: new Set(), sRetInvoices: new Set(), pRetInvoices: new Set(),
          sLines: 0, pLines: 0, sRetLines: 0, pRetLines: 0,
          sPriceTotal: 0, pPriceTotal: 0, sRetPriceTotal: 0, pRetPriceTotal: 0,
          sHours: 0, pHours: 0, sRetHours: 0, pRetHours: 0,
          allocatedCost: 0
        };

      const val = (row.qty || 0) * (row.price || 0);
      const qty = row.qty || 0;
      const price = row.price || 0;
      const invCode = String(row.invCode || row.recCode || "unknown");
      const hourStr = row.hour ? String(row.hour).replace(/\D/g, '') : "12";
      const hour = parseInt(hourStr) || 12;

      if (row.module_type === 'sales') {
        categoryTotals[catKey].salesAmt += val;
        categoryTotals[catKey].qtySales += qty;
        categoryTotals[catKey].sLines += 1;
        categoryTotals[catKey].sPriceTotal += price;
        categoryTotals[catKey].sHours += hour;
        categoryTotals[catKey].sInvoices.add(invCode);
        totalGlobalSales += val;
      } else if (row.module_type === 'purchases') {
        categoryTotals[catKey].purchaseAmt += val;
        categoryTotals[catKey].qtyPurchase += qty;
        categoryTotals[catKey].pLines += 1;
        categoryTotals[catKey].pPriceTotal += price;
        categoryTotals[catKey].pHours += hour;
        categoryTotals[catKey].pInvoices.add(invCode);
        totalGlobalPurchases += val;
      } else if (row.module_type === 'sales_returns') {
        categoryTotals[catKey].salesRetAmt += val;
        categoryTotals[catKey].qtySalesRet += qty;
        categoryTotals[catKey].sRetLines += 1;
        categoryTotals[catKey].sRetPriceTotal += price;
        categoryTotals[catKey].sRetHours += hour;
        categoryTotals[catKey].sRetInvoices.add(invCode);
      } else if (row.module_type === 'purchase_returns') {
        categoryTotals[catKey].pRetAmt += val;
        categoryTotals[catKey].qtyPRet += qty;
        categoryTotals[catKey].pRetLines += 1;
        categoryTotals[catKey].pRetPriceTotal += price;
        categoryTotals[catKey].pRetHours += hour;
        categoryTotals[catKey].pRetInvoices.add(invCode);
      }
    }

    const reportRows: any[] = [];
    let totalCostAllocated = 0;

    // Track allocation by center for visualizations
    const centerBreakdowns: Record<number, any[]> = {};
    costCenters.forEach((cc) => (centerBreakdowns[cc.id] = []));

    // Phase 2: Distribute Cost Centers to targeted Categories
    for (const cc of costCenters) {
      let tCat: string[] = cc.target_categories ? cc.target_categories.split(",") : [];
      if (tCat.length === 0 && autoCenterTargets[cc.name]) {
         tCat = Array.from(autoCenterTargets[cc.name]);
      }

      const getBaseValue = (cat: any) => {
         // Original Bases
         if (cc.allocation_base === "sales_value" || cc.allocation_base === "sales_price") return cat.salesAmt;
         if (cc.allocation_base === "purchase_value" || cc.allocation_base === "purchase_price") return cat.purchaseAmt;
         if (cc.allocation_base === "sales_qty") return cat.qtySales;
         if (cc.allocation_base === "purchase_qty") return cat.qtyPurchase;
         if (cc.allocation_base === "sales_invoice_count") return cat.sInvoices.size;
         if (cc.allocation_base === "purchase_invoice_count") return cat.pInvoices.size;
         if (cc.allocation_base === "time_spent") return cat.sLines; // Time spent corresponds to sales lines processing
         
         // New Combined Bases
         if (cc.allocation_base === "sales_and_purchase_qty") return cat.qtySales + cat.qtyPurchase;
         if (cc.allocation_base === "sales_and_purchase_value") return cat.salesAmt + cat.purchaseAmt;
         if (cc.allocation_base === "sales_and_purchase_hours") return cat.sHours + cat.pHours;
         if (cc.allocation_base === "sales_and_purchase_invoice_count") return cat.sInvoices.size + cat.pInvoices.size;
         if (cc.allocation_base === "sales_and_purchase_price") return cat.sPriceTotal + cat.pPriceTotal;
         if (cc.allocation_base === "sales_and_purchase_and_returns_price") return cat.sPriceTotal + cat.pPriceTotal + cat.sRetPriceTotal + cat.pRetPriceTotal;
         if (cc.allocation_base === "sales_and_purchase_and_returns_invoice_count") return cat.sInvoices.size + cat.pInvoices.size + cat.sRetInvoices.size + cat.pRetInvoices.size;
         if (cc.allocation_base === "sales_and_purchase_and_returns_qty") return cat.qtySales + cat.qtyPurchase + cat.qtySalesRet + cat.qtyPRet;
         if (cc.allocation_base === "sales_and_purchase_and_returns_hours") return cat.sHours + cat.pHours + cat.sRetHours + cat.pRetHours;

         return cat.salesAmt; // fallback
      };

      // Find valid categories and sum their base values
      let sumBase = 0;
      const validCategories: Array<{catKey: string, level1: string, level2: string, base: number}> = [];
      
      for (const [catKey, t] of Object.entries(categoryTotals)) {
         const [level1, level2] = catKey.split("|");
         if (tCat.length > 0 && !tCat.includes(level1) && !tCat.includes(`${level1} - ${level2}`)) {
            continue; // Skipped, not in target
         }
         const baseVal = getBaseValue(t);
         sumBase += baseVal;
         validCategories.push({ catKey, level1, level2, base: baseVal });
      }

      // Distribute cost to valid categories proportionally
      if (sumBase > 0) {
         for (const vc of validCategories) {
            const fraction = vc.base / sumBase;
            const allocatedAmt = cc.total_cost * fraction;
            categoryTotals[vc.catKey].allocatedCost += allocatedAmt;
            
            if (allocatedAmt > 0) {
               const catName = cc.allocation_level === 'level_2' ? `${vc.level1} - ${vc.level2}` : vc.level1;
               centerBreakdowns[cc.id].push({
                  category: catName,
                  amount: allocatedAmt
               });
            }
         }
         totalCostAllocated += cc.total_cost;
      }
    }

    // Phase 3: Construct Reports
    const reportRowsLevel2 = [];
    const level1Totals: Record<string, any> = {};

    for (const [catKey, t] of Object.entries(categoryTotals)) {
      const [level1, level2] = catKey.split("|");

      // Calc global ratios for display
      const salesRatio = totalGlobalSales ? t.salesAmt / totalGlobalSales : 0;
      const purchaseRatio = totalGlobalPurchases ? t.purchaseAmt / totalGlobalPurchases : 0;
      const ratioCost = totalCostAllocated > 0 ? t.allocatedCost / totalCostAllocated : 0;

      reportRowsLevel2.push({
        level1,
        level2,
        purchaseAmt: t.purchaseAmt,
        purchaseRatio: (purchaseRatio * 100).toFixed(2),
        salesAmt: t.salesAmt,
        salesRatio: (salesRatio * 100).toFixed(2),
        costAmt: Math.round(t.allocatedCost),
        costRatio: (ratioCost * 100).toFixed(2),
        costToSales: t.salesAmt ? ((t.allocatedCost / t.salesAmt) * 100).toFixed(2) : 0,
      });

      if (!level1Totals[level1]) {
         level1Totals[level1] = { salesAmt: 0, purchaseAmt: 0, allocatedCost: 0 };
      }
      level1Totals[level1].salesAmt += t.salesAmt;
      level1Totals[level1].purchaseAmt += t.purchaseAmt;
      level1Totals[level1].allocatedCost += t.allocatedCost;
    }

    const reportRowsLevel1 = Object.entries(level1Totals).map(([level1, t]) => {
      const salesRatio = totalGlobalSales ? t.salesAmt / totalGlobalSales : 0;
      const purchaseRatio = totalGlobalPurchases ? t.purchaseAmt / totalGlobalPurchases : 0;
      const ratioCost = totalCostAllocated > 0 ? t.allocatedCost / totalCostAllocated : 0;
      return {
        level1,
        level2: '-',
        purchaseAmt: t.purchaseAmt,
        purchaseRatio: (purchaseRatio * 100).toFixed(2),
        salesAmt: t.salesAmt,
        salesRatio: (salesRatio * 100).toFixed(2),
        costAmt: Math.round(t.allocatedCost),
        costRatio: (ratioCost * 100).toFixed(2),
        costToSales: t.salesAmt ? ((t.allocatedCost / t.salesAmt) * 100).toFixed(2) : 0,
      };
    });

    // Build visualizations
    const costCenterVisuals = costCenters.map((cc) => {
      const bd = centerBreakdowns[cc.id] || [];
      const mapCategory: Record<string, number> = {};
      bd.forEach((b) => {
        mapCategory[b.category] = (mapCategory[b.category] || 0) + b.amount;
      });
      const chartData = Object.entries(mapCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      return {
        id: cc.id,
        name: cc.name,
        total_cost: cc.total_cost,
        allocation_base: cc.allocation_base,
        target_categories: cc.target_categories,
        chartData,
      };
    });

    reportRowsLevel2.sort((a, b) => a.level1.localeCompare(b.level1) || a.level2.localeCompare(b.level2));
    reportRowsLevel1.sort((a, b) => a.level1.localeCompare(b.level1));

    // Output true calculated ABC report
    res.json({
      mock: false,
      dataLevel1: reportRowsLevel1,
      dataLevel2: reportRowsLevel2,
      costCenterVisuals,
      totals: {
        purchaseAmt: totalGlobalPurchases,
        salesAmt: totalGlobalSales,
        costAmt: totalCostAllocated,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Advanced Modules API Routes
app.get("/api/reports/pareto", (req, res) => {
  try {
    const period = (req.query.period as string) || "";
    // Interval settings for invoice classification
    const intervalSettingsStr = (req.query.intervalSettings as string);
    let intervalSettings: any = { enabled: false, min: 0, max: 10000000, step: 1000000 };
    if (intervalSettingsStr) {
      try {
        intervalSettings = { enabled: true, ...JSON.parse(intervalSettingsStr) };
      } catch(e){}
    }

    // 1. Get products for mapping
    const products = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, json_extract(data, '$.mainGroup') as mainGrp, json_extract(data, '$.subGroup') as subGrp FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'").iterate();
    
    const pMap: Record<string, any> = {};
    for (const p of products) {
       const row = p as any;
       if (row.code) pMap[row.code] = { name: row.name || 'نامشخص', mainGrp: row.mainGrp || 'نامشخص', subGrp: row.subGrp || 'نامشخص' };
    }

    // 2. Get Sales data including returns
    const sales = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty, CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price, json_extract(data, '$.invoiceCode') as invCode, json_extract(data, '$.date') as date, f.module_type FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);

    // Dictionaries for aggregation
    const productStats: Record<string, { qty: number, amt: number, code: string, name: string, l1: string, l2: string, invoices: Set<string> }> = {};
    const l1Stats: Record<string, { qty: number, amt: number, invoices: Set<string>, name: string }> = {};
    const l2Stats: Record<string, { qty: number, amt: number, invoices: Set<string>, name: string }> = {};
    
    // Invoice aggregator
    const invoiceStats: Record<string, number> = {};

    for (const s of sales) {
       const row = s as any;
       const isReturn = row.module_type === 'sales_returns';
       const mult = isReturn ? -1 : 1;
       const q = (row.qty || 0) * mult;
       const p = row.price || 0;
       const amt = q * p;
       const code = row.code || 'unknown';
       let pInfo = pMap[code] || { name: row.name || code, mainGrp: 'سایر', subGrp: 'سایر' };
       const l1 = pInfo.mainGrp;
       const l2 = l1 + ' - ' + pInfo.subGrp;
       const inv = row.invCode || 'none';

       // Products
       if (!productStats[code]) productStats[code] = { qty: 0, amt: 0, code, name: pInfo.name, l1, l2, invoices: new Set() };
       productStats[code].qty += q;
       productStats[code].amt += amt;
       if (inv !== 'none' && !isReturn) productStats[code].invoices.add(inv);

       // Level 1
       if (!l1Stats[l1]) l1Stats[l1] = { qty: 0, amt: 0, name: l1, invoices: new Set() };
       l1Stats[l1].qty += q;
       l1Stats[l1].amt += amt;
       if (inv !== 'none' && !isReturn) l1Stats[l1].invoices.add(inv);

       // Level 2
       if (!l2Stats[l2]) l2Stats[l2] = { qty: 0, amt: 0, name: l2, invoices: new Set() };
       l2Stats[l2].qty += q;
       l2Stats[l2].amt += amt;
       if (inv !== 'none' && !isReturn) l2Stats[l2].invoices.add(inv);

       // Invoice
       if (inv !== 'none') {
          invoiceStats[inv] = (invoiceStats[inv] || 0) + amt;
       }
    }

    // 3. Process Pareto for Products (Value and Quantity)
    const calcPareto = (list: any[], valueKey: string) => {
        let sorted = list.sort((a,b) => b[valueKey] - a[valueKey]).filter(x => x[valueKey] > 0);
        let total = sorted.reduce((sum, item) => sum + item[valueKey], 0);
        let cumSum = 0;
        return sorted.map(item => {
           cumSum += item[valueKey];
           let cumPercent = total > 0 ? (cumSum / total) * 100 : 0;
           let abcClass = cumPercent <= 80 ? 'A' : (cumPercent <= 95 ? 'B' : 'C');
           return { ...item, _totalVal: total, cumSum, cumPercent, abcClass };
        });
    };

    const pArr = Object.values(productStats);
    const paretoProdAmt = calcPareto(pArr, 'amt');
    const paretoProdQty = calcPareto(pArr, 'qty');
    
    // Level 1 and 2 Arrays
    const l1Arr = calcPareto(Object.values(l1Stats).map(x => ({...x, invoiceCount: x.invoices.size})), 'amt');
    const l2Arr = calcPareto(Object.values(l2Stats).map(x => ({...x, invoiceCount: x.invoices.size})), 'amt');

    // Extremes
    const topProdAmt = paretoProdAmt[0] || null;
    const botProdAmt = paretoProdAmt[paretoProdAmt.length - 1] || null;
    const topProdQty = paretoProdQty[0] || null;
    const botProdQty = paretoProdQty[paretoProdQty.length - 1] || null;

    // 4. Invoice Classification
    let invoiceClasses: { range: string, rangeMin: number, rangeMax: number, count: number, totalAmt: number, countPercent?: number, amtPercent?: number, cumCountPercent?: number, cumAmtPercent?: number }[] = [];
    let totalInvCount = 0;
    let totalInvAmt = 0;

    if (intervalSettings.enabled) {
        let classesMap: Record<string, {count: number, totalAmt: number, rangeMin: number, rangeMax: number}> = {};
        const useCustomBins = intervalSettings.customBins && Array.isArray(intervalSettings.customBins) && intervalSettings.customBins.length > 0;
        let sortedBins = useCustomBins ? [...intervalSettings.customBins].sort((a,b)=>a-b) : [];
        let min = intervalSettings.min || 0;
        let max = intervalSettings.max || 10000000;
        let step = intervalSettings.step || 1000000;

        // Pre-populate custom bins to maintain order even if empty
        if (useCustomBins) {
           let rMin = 0;
           for (let i = 0; i < sortedBins.length; i++) {
               let b = sortedBins[i];
               let label = i === 0 ? `<${b.toLocaleString()}` : `${rMin.toLocaleString()}-${b.toLocaleString()}`;
               classesMap[label] = { count: 0, totalAmt: 0, rangeMin: i === 0 ? -1 : rMin, rangeMax: b };
               rMin = b + 1;
           }
           classesMap[`>${sortedBins[sortedBins.length-1].toLocaleString()}`] = { count: 0, totalAmt: 0, rangeMin: sortedBins[sortedBins.length-1] + 1, rangeMax: Infinity };
        }

        for (let inv in invoiceStats) {
           let val = invoiceStats[inv];
           if (val > 0) {
               totalInvCount++;
               totalInvAmt += val;
               
               let rangeLabel = "";
               let rMin = 0;
               let rMax = 0;

               if (useCustomBins) {
                   let bIdx = sortedBins.findIndex(b => val <= b);
                   if (bIdx === 0) {
                       rangeLabel = `<${sortedBins[0].toLocaleString()}`;
                       rMin = -1;
                       rMax = sortedBins[0];
                   } else if (bIdx > 0) {
                       rMin = sortedBins[bIdx - 1] + 1;
                       rMax = sortedBins[bIdx];
                       rangeLabel = `${rMin.toLocaleString()}-${rMax.toLocaleString()}`;
                   } else {
                       rMin = sortedBins[sortedBins.length - 1] + 1;
                       rMax = Infinity;
                       rangeLabel = `>${sortedBins[sortedBins.length - 1].toLocaleString()}`;
                   }
               } else {
                   if (val <= min) {
                       rangeLabel = `<${min.toLocaleString()}`;
                       rMin = -1;
                       rMax = min;
                   } else if (val > max) {
                       rangeLabel = `>${max.toLocaleString()}`;
                       rMin = max + 1;
                       rMax = Infinity;
                   } else {
                       let cIndex = Math.floor((val - min - 1) / step);
                       rMin = min + (cIndex * step) + 1;
                       rMax = rMin + step - 1;
                       rangeLabel = `${rMin.toLocaleString()}-${rMax.toLocaleString()}`;
                   }
               }

               if (!classesMap[rangeLabel]) classesMap[rangeLabel] = { count: 0, totalAmt: 0, rangeMin: rMin, rangeMax: rMax };
               classesMap[rangeLabel].count++;
               classesMap[rangeLabel].totalAmt += val;
           }
        }
        
        invoiceClasses = Object.keys(classesMap).map(k => ({
            range: k,
            rangeMin: classesMap[k].rangeMin,
            rangeMax: classesMap[k].rangeMax,
            count: classesMap[k].count,
            totalAmt: classesMap[k].totalAmt
        })).sort((a,b) => a.rangeMin - b.rangeMin);

        let cumCount = 0;
        let cumAmt = 0;
        for (let c of invoiceClasses) {
            cumCount += c.count;
            cumAmt += c.totalAmt;
            c.countPercent = totalInvCount > 0 ? (c.count / totalInvCount) * 100 : 0;
            c.amtPercent = totalInvAmt > 0 ? (c.totalAmt / totalInvAmt) * 100 : 0;
            c.cumCountPercent = totalInvCount > 0 ? (cumCount / totalInvCount) * 100 : 0;
            c.cumAmtPercent = totalInvAmt > 0 ? (cumAmt / totalInvAmt) * 100 : 0;
        }
    }

    res.json({
       paretoProdAmt,
       paretoProdQty,
       l1Arr,
       l2Arr,
       invoiceClasses,
       totalInvCount,
       totalInvAmt,
       extremes: { topProdAmt, botProdAmt, topProdQty, botProdQty }
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({error: "Failed to generate pareto report"});
  }
});

app.get("/api/reports/weekly", (req, res) => {
  try {
    const period = (req.query.period as string) || "";
    
    // 1. Get products for mapping
    const products = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, json_extract(data, '$.mainGroup') as mainGrp, json_extract(data, '$.subGroup') as subGrp, json_extract(data, '$.activityCenter') as ac FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'").iterate();
    
    const pMap: Record<string, {name: string, l1: string, l2: string, ac: string}> = {};
    for (const p of products) {
       const row = p as any;
       if (row.code) pMap[row.code] = { name: row.name || 'نامشخص', l1: row.mainGrp || 'نامشخص', l2: row.subGrp || 'نامشخص', ac: row.ac || 'نامشخص' };
    }

    // 2. Get Sales data
    const sales = db.prepare("SELECT json_extract(data, '$.productCode') as code, CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty, CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price, json_extract(data, '$.date') as date, f.module_type FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);
    
    const salesRows: any[] = [];
    let minJDN = Infinity;
    
    for (const s of sales) {
       const row = s as any;
       if (!row.date) continue;
       const parts = String(row.date).split('/');
       if (parts.length === 3) {
           const jy = parseInt(parts[0]);
           const jm = parseInt(parts[1]);
           const jd = parseInt(parts[2]);
           if (jy && jm && jd) {
               const gDate = jalaali.toGregorian(jy, jm, jd);
               const jdn = Math.floor(new Date(gDate.gy, gDate.gm - 1, gDate.gd).getTime() / 86400000);
               row.jdn = jdn;
               if (jdn < minJDN) minJDN = jdn;
               salesRows.push(row);
           }
       }
    }
    
    if (salesRows.length === 0) {
        return res.json({ weeks: [], rows: [] });
    }

    let maxWeek = 1;
    for (const row of salesRows) {
        row.week = Math.floor((row.jdn - minJDN) / 7) + 1;
        if (row.week > maxWeek) maxWeek = row.week;
    }

    const aggregated: Record<string, { l1: string, l2: string, ac: string, weeksAmt: Record<number, number>, weeksQty: Record<number, number> }> = {};

    for (const row of salesRows) {
        const isReturn = row.module_type === 'sales_returns';
        const mult = isReturn ? -1 : 1;
        const qty = (row.qty || 0) * mult;
        const amt = qty * (row.price || 0);

        const code = row.code || 'unknown';
        const pInfo = pMap[code] || { name: 'نامشخص', l1: 'سایر', l2: 'سایر', ac: 'سایر' };
        const key = `${pInfo.l1}::${pInfo.l2}::${pInfo.ac}`;
        
        if (!aggregated[key]) {
            aggregated[key] = { l1: pInfo.l1, l2: pInfo.l2, ac: pInfo.ac, weeksAmt: {}, weeksQty: {} };
        }
        aggregated[key].weeksAmt[row.week] = (aggregated[key].weeksAmt[row.week] || 0) + amt;
        aggregated[key].weeksQty[row.week] = (aggregated[key].weeksQty[row.week] || 0) + qty;
    }

    const weeksHeaders = Array.from({length: maxWeek}, (_, i) => i + 1);

    const resultRows = Object.values(aggregated).map(agg => {
        const wAmt: Record<string, any> = {};
        const wQty: Record<string, any> = {};
        for (const w of weeksHeaders) {
            wAmt[`w${w}`] = agg.weeksAmt[w] || 0;
            wQty[`w${w}`] = agg.weeksQty[w] || 0;
            
            if (w > 1) {
                const prevAmt = agg.weeksAmt[w-1] || 0;
                wAmt[`g${w}`] = prevAmt !== 0 ? (wAmt[`w${w}`] - prevAmt) / Math.abs(prevAmt) : 0;
                
                const prevQty = agg.weeksQty[w-1] || 0;
                wQty[`g${w}`] = prevQty !== 0 ? (wQty[`w${w}`] - prevQty) / Math.abs(prevQty) : 0;
            } else {
                wAmt[`g${w}`] = 0;
                wQty[`g${w}`] = 0;
            }
        }
        return { l1: agg.l1, l2: agg.l2, ac: agg.ac, wAmt, wQty };
    });

    res.json({ weeks: weeksHeaders.reverse(), rows: resultRows.sort((a,b) => (a.l1 || "").localeCompare(b.l1 || "") || (a.l2 || "").localeCompare(b.l2 || "")) });
  } catch(e) {
    console.error(e);
    res.status(500).json({error: "Failed to generate weekly report"});
  }
});

app.get("/api/reports/sales", (req, res) => {
  try {
    const period = (req.query.period as string) || "";

    const products = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, json_extract(data, '$.mainGroup') as mainGrp, json_extract(data, '$.subGroup') as subGrp FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'").iterate();
    
    const pMap: Record<string, any> = {};
    for (const p of products) {
       const row = p as any;
       if (row.code) pMap[row.code] = { name: row.name || 'نامشخص', mainGrp: row.mainGrp || 'نامشخص', subGrp: row.subGrp || 'نامشخص' };
    }

    const sales = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty, CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price, SUBSTR(coalesce(json_extract(data, '$.time'), '12:00'), 1, 2) as hour, f.module_type FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);

    const purchases = db.prepare("SELECT json_extract(data, '$.productCode') as code, CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty, CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price, f.module_type FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('purchases', 'purchase_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);

    let totalVolume = 0;
    let totalQty = 0;
    const trafficMap: Record<string, number> = {};
    const productStats: Record<string, any> = {};
    const catLevel1Stats: Record<string, any> = {};
    const catLevel2Stats: Record<string, any> = {};

    const initStats = () => ({ salesQty: 0, salesAmt: 0, returnQty: 0, returnAmt: 0, netQty: 0, netAmt: 0, purchQty: 0, purchAmt: 0, retPurchQty: 0, retPurchAmt: 0, netPurchQty: 0, netPurchAmt: 0, basketCount: 0 });

    for (const s of sales) {
       const row = s as any;
       const code = row.code || 'unknown';
       let pInfo = pMap[code] || { name: row.name || code, mainGrp: 'سایر', subGrp: 'سایر' };
       const l1 = pInfo.mainGrp;
       const l2 = l1 + ' - ' + pInfo.subGrp;
       
       if (!productStats[code]) productStats[code] = { name: pInfo.name, ...initStats() };
       if (!catLevel1Stats[l1]) catLevel1Stats[l1] = { name: l1, ...initStats() };
       if (!catLevel2Stats[l2]) catLevel2Stats[l2] = { name: l2, ...initStats() };

       const q = row.qty || 0;
       const p = row.price || 0;
       const amt = q * p;

       if (row.module_type === 'sales') {
          totalQty += q; totalVolume += amt;
          productStats[code].salesQty += q; productStats[code].salesAmt += amt;
          catLevel1Stats[l1].salesQty += q; catLevel1Stats[l1].salesAmt += amt;
          catLevel2Stats[l2].salesQty += q; catLevel2Stats[l2].salesAmt += amt;
          productStats[code].basketCount += 1;
          catLevel1Stats[l1].basketCount += 1;
          catLevel2Stats[l2].basketCount += 1;
       } else {
          totalQty -= q; totalVolume -= amt;
          productStats[code].returnQty += q; productStats[code].returnAmt += amt;
          catLevel1Stats[l1].returnQty += q; catLevel1Stats[l1].returnAmt += amt;
          catLevel2Stats[l2].returnQty += q; catLevel2Stats[l2].returnAmt += amt;
       }

       // Net
       productStats[code].netQty = productStats[code].salesQty - productStats[code].returnQty;
       productStats[code].netAmt = productStats[code].salesAmt - productStats[code].returnAmt;
       catLevel1Stats[l1].netQty = catLevel1Stats[l1].salesQty - catLevel1Stats[l1].returnQty;
       catLevel1Stats[l1].netAmt = catLevel1Stats[l1].salesAmt - catLevel1Stats[l1].returnAmt;
       catLevel2Stats[l2].netQty = catLevel2Stats[l2].salesQty - catLevel2Stats[l2].returnQty;
       catLevel2Stats[l2].netAmt = catLevel2Stats[l2].salesAmt - catLevel2Stats[l2].returnAmt;

       if (row.module_type === 'sales') {
          const h = row.hour || "12";
          trafficMap[h] = (trafficMap[h] || 0) + 1;
       }
    }

    for (const pu of purchases) {
       const row = pu as any;
       const code = row.code || 'unknown';
       let pInfo = pMap[code] || { name: code, mainGrp: 'سایر', subGrp: 'سایر' };
       const l1 = pInfo.mainGrp;
       const l2 = l1 + ' - ' + pInfo.subGrp;
       
       if (!productStats[code]) productStats[code] = { name: pInfo.name, ...initStats() };
       if (!catLevel1Stats[l1]) catLevel1Stats[l1] = { name: l1, ...initStats() };
       if (!catLevel2Stats[l2]) catLevel2Stats[l2] = { name: l2, ...initStats() };

       const q = row.qty || 0;
       const p = row.price || 0;
       const amt = q * p;

       if (row.module_type === 'purchases') {
          productStats[code].purchQty += q; productStats[code].purchAmt += amt;
          catLevel1Stats[l1].purchQty += q; catLevel1Stats[l1].purchAmt += amt;
          catLevel2Stats[l2].purchQty += q; catLevel2Stats[l2].purchAmt += amt;
       } else {
          productStats[code].retPurchQty += q; productStats[code].retPurchAmt += amt;
          catLevel1Stats[l1].retPurchQty += q; catLevel1Stats[l1].retPurchAmt += amt;
          catLevel2Stats[l2].retPurchQty += q; catLevel2Stats[l2].retPurchAmt += amt;
       }

       productStats[code].netPurchQty = productStats[code].purchQty - productStats[code].retPurchQty;
       productStats[code].netPurchAmt = productStats[code].purchAmt - productStats[code].retPurchAmt;
       catLevel1Stats[l1].netPurchQty = catLevel1Stats[l1].purchQty - catLevel1Stats[l1].retPurchQty;
       catLevel1Stats[l1].netPurchAmt = catLevel1Stats[l1].purchAmt - catLevel1Stats[l1].retPurchAmt;
       catLevel2Stats[l2].netPurchQty = catLevel2Stats[l2].purchQty - catLevel2Stats[l2].retPurchQty;
       catLevel2Stats[l2].netPurchAmt = catLevel2Stats[l2].purchAmt - catLevel2Stats[l2].retPurchAmt;
    }

    const calcMargin = (statsMap: Record<string, any>) => {
      return Object.entries(statsMap).map(([k, v]) => {
         const avgCogs = v.netPurchQty > 0 ? v.netPurchAmt / v.netPurchQty : 0;
         const cogsForSales = v.netQty * avgCogs;
         const profit = v.netAmt - cogsForSales;
         const marginPercent = v.netAmt > 0 ? (profit / v.netAmt) * 100 : 0;
         return {
            name: v.name || k,
            ...v,
            avgCogs,
            cogsForSales,
            profit,
            marginPercent
         }
      });
    };

    const prodArr = calcMargin(productStats);
    const l1Arr = calcMargin(catLevel1Stats);
    const l2Arr = calcMargin(catLevel2Stats);

    const trafficArr = Object.entries(trafficMap).map(([hour, count]) => ({hour, count})).sort((a,b)=>a.hour.localeCompare(b.hour));
    
    const topReturnedProducts = [...prodArr].sort((a,b) => b.returnAmt - a.returnAmt).slice(0,10);
    const topReturnedCatL1 = [...l1Arr].sort((a,b) => b.returnAmt - a.returnAmt).slice(0,5);
    const topReturnedCatL2 = [...l2Arr].sort((a,b) => b.returnAmt - a.returnAmt).slice(0,5);
    
    // Basket analysis
    const basketArr = [...prodArr].filter(p => p.netQty > 0 || p.netAmt > 0).sort((a,b) => b.netAmt - a.netAmt).slice(0, 10);
    const basketL1 = [...l1Arr].filter(c => c.netQty > 0 || c.netAmt > 0).sort((a,b) => b.netAmt - a.netAmt);
    const basketL2 = [...l2Arr].filter(c => c.netQty > 0 || c.netAmt > 0).sort((a,b) => b.netAmt - a.netAmt);

    res.json({
       totalVolume,
       totalQty,
       trafficArr,
       topReturnedProducts,
       topReturnedCatL1,
       topReturnedCatL2,
       basketArr,
       basketL1,
       basketL2,
       profitL1: l1Arr,
       profitL2: l2Arr,
       products: prodArr
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({error: "Failed to load sales report"});
  }
});

app.get("/api/reports/inventory", (req, res) => {
  try {
    const period = (req.query.period as string) || "";
    let currentStock = 0;

    const aggregateQty = (modType: string, multiplier: number) => {
      const dbres = db
        .prepare(
          `
        SELECT SUM(CAST(json_extract(data, '$.quantity') AS REAL)) as totalQty
        FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = ?
        AND isInPeriod(json_extract(data, '$.date'), ?) = 1
      `,
        )
        .get(modType, period) as any;
      currentStock += (dbres?.totalQty || 0) * multiplier;
    };

    aggregateQty("opening_inventory", 1);
    aggregateQty("purchases", 1);
    aggregateQty("sales", -1);
    aggregateQty("purchase_returns", -1);
    aggregateQty("sales_returns", 1);

    // Advanced Supplier & Logistics Returns Analysis
    const products = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, json_extract(data, '$.mainGroup') as mainGrp, json_extract(data, '$.subGroup') as subGrp FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'").iterate();
    
    const pMap: Record<string, any> = {};
    for (const p of products) {
       const row = p as any;
       if (row.code) pMap[row.code] = { name: row.name || 'نامشخص', mainGrp: row.mainGrp || 'نامشخص', subGrp: row.subGrp || 'نامشخص' };
    }

    const purchReturns = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty, CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'purchase_returns' AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);

    const retL1: Record<string, any> = {};
    const retL2: Record<string, any> = {};
    const retProducts: Record<string, any> = {};

    const initD = () => ({qty: 0, amt: 0});

    for (const pr of purchReturns) {
       const row = pr as any;
       const code = row.code || 'unknown';
       let pInfo = pMap[code] || { name: row.name || code, mainGrp: 'سایر', subGrp: 'سایر' };
       const l1 = pInfo.mainGrp;
       const l2 = l1 + ' - ' + pInfo.subGrp;

       if (!retL1[l1]) retL1[l1] = {name: l1, ...initD()};
       if (!retL2[l2]) retL2[l2] = {name: l2, ...initD()};
       if (!retProducts[code]) retProducts[code] = {name: pInfo.name, ...initD()};

       const q = row.qty || 0;
       const amt = q * (row.price || 0);

       retL1[l1].qty += q; retL1[l1].amt += amt;
       retL2[l2].qty += q; retL2[l2].amt += amt;
       retProducts[code].qty += q; retProducts[code].amt += amt;
    }

    const L1Arr = Object.values(retL1).sort((a:any,b:any) => b.amt - a.amt);
    const L2Arr = Object.values(retL2).sort((a:any,b:any) => b.amt - a.amt);
    const pArr = Object.values(retProducts).sort((a:any,b:any) => b.amt - a.amt);

    res.json({
      currentStock,
      unitControlArr: [],
      supplierArr: [],
      velocityArr: [],
      wastageArr: [],
      retL1: L1Arr,
      retL2: L2Arr,
      retProducts: pArr
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({error: "Failed to generate inventory reports"});
  }
});


app.get("/api/reports/profit", (req, res) => {
  try {
    const period = (req.query.period as string) || "";
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";
    const exactDate = (req.query.exactDate as string) || "";
    
    // We fetch all products to be able to map subGroups etc.
    const products = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, json_extract(data, '$.mainGroup') as mainGrp, json_extract(data, '$.subGroup') as subGrp FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'").iterate();
    
    const pMap: Record<string, {name: string, l1: string, l2: string, unit: string}> = {};
    for (const p of products) {
       const row = p as any;
       if (row.code) pMap[row.code] = { name: row.name || "نامشخص", l1: row.mainGrp || "سایر", l2: row.subGrp || "سایر", unit: "عدد" }; 
    }

    const salesIter = db.prepare(`SELECT 
      json_extract(data, '$.date') as date,
      json_extract(data, '$.productCode') as code,
      json_extract(data, '$.productName') as productName,
      CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty,
      CAST(REPLACE(json_extract(data, '$.price'), ',', '') AS REAL) as price,
      CAST(REPLACE(json_extract(data, '$.costPrice'), ',', '') AS REAL) as costPrice,
      CAST(REPLACE(json_extract(data, '$.lastPurchasePrice'), ',', '') AS REAL) as lastPurchasePrice,
      f.module_type
      FROM raw_data r JOIN files f ON r.file_id = f.id 
      WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1`).iterate(period);

    const transactionRows: any[] = [];
    for (const s of salesIter) {
       const row = s as any;
       if (!row.date || !row.code) continue;
       if (exactDate && row.date !== exactDate) continue;
       if (startDate && row.date < startDate) continue;
       if (endDate && row.date > endDate) continue;
       
       let pInfo = pMap[row.code];
       if (!pInfo) pInfo = { name: row.productName || "نامشخص", l1: "سایر", l2: "سایر", unit: "عدد" };

       let qty = row.qty || 0;
       if (row.module_type === "sales_returns") qty = -qty;

       const p = row.price || 0;
       const cp = row.costPrice || 0;
       const lpp = row.lastPurchasePrice || 0;
       
       let isProfit = false;
       let isLoss = false;
       let isBreakeven = false;       
       let profitLossPerUnit = 0;
       
       if (cp > 0 && lpp > 0) {
           if (p < cp && p < lpp) {
               isLoss = true;
               profitLossPerUnit = p - lpp; 
           } else if (p > cp && p > lpp) {
               isProfit = true;
               profitLossPerUnit = p - Math.max(cp, lpp); 
           } else {
               isBreakeven = true;
               profitLossPerUnit = 0;
           }
       } else if (cp > 0) {
           if (p < cp) {
               isLoss = true;
               profitLossPerUnit = p - cp;
           } else if (p > cp) {
               isProfit = true;
               profitLossPerUnit = p - cp;
           } else {
               isBreakeven = true;
           }
       } else if (lpp > 0) {
           if (p < lpp) {
               isLoss = true;
               profitLossPerUnit = p - lpp;
           } else if (p > lpp) {
               isProfit = true;
               profitLossPerUnit = p - lpp;
           } else {
               isBreakeven = true;
           }
       } else {
           isBreakeven = true; 
       }
       
       const totalProfitLossRaw = profitLossPerUnit * qty;
       // let status = isLoss ? "loss" : (isProfit ? "profit" : "breakeven");

       transactionRows.push({
           date: row.date,
           code: row.code,
           name: pInfo.name,
           unit: pInfo.unit,
           qty: qty,
           price: p,
           costPrice: cp,
           lastPurchasePrice: lpp,
           totalSales: p * qty,
           profitLossPerUnit: profitLossPerUnit,
           totalProfitLoss: totalProfitLossRaw,
           // status: status,
           l1: pInfo.l1,
           l2: pInfo.l2
       });
    }

    const dayRowsMap: Record<string, any> = {};
    const rangeAgg: Record<string, any> = {};
    const l1Agg: Record<string, any> = {};
    const l2Agg: Record<string, any> = {};

    transactionRows.forEach(r => {
       const dayKey = `${r.date}_${r.code}`;
       if (!dayRowsMap[dayKey]) {
          dayRowsMap[dayKey] = { ...r, qty: 0, totalSales: 0, totalProfitLoss: 0, count: 0 };
       }
       dayRowsMap[dayKey].qty += r.qty;
       dayRowsMap[dayKey].totalSales += r.totalSales;
       dayRowsMap[dayKey].totalProfitLoss += r.totalProfitLoss;
       dayRowsMap[dayKey].count += 1;

       if (!rangeAgg[r.code]) {
          rangeAgg[r.code] = { ...r, qty: 0, totalSales: 0, totalProfitLoss: 0, count: 0 };
       }
       rangeAgg[r.code].qty += r.qty;
       rangeAgg[r.code].totalSales += r.totalSales;
       rangeAgg[r.code].totalProfitLoss += r.totalProfitLoss;
       rangeAgg[r.code].count += 1;

       const l1 = r.l1 || 'سایر';
       if (!l1Agg[l1]) l1Agg[l1] = { name: l1, totalSales: 0, profit: 0, loss: 0, net: 0, count: 0 };
       l1Agg[l1].totalSales += r.totalSales;
       l1Agg[l1].net += r.totalProfitLoss;
       l1Agg[l1].count += 1;
       if (r.totalProfitLoss > 0) l1Agg[l1].profit += r.totalProfitLoss;
       if (r.totalProfitLoss < 0) l1Agg[l1].loss += Math.abs(r.totalProfitLoss);

       const l2Key = l1 + '::' + (r.l2 || 'سایر');
       if (!l2Agg[l2Key]) l2Agg[l2Key] = { l1: l1, l2: r.l2 || 'سایر', totalSales: 0, profit: 0, loss: 0, net: 0, count: 0 };
       l2Agg[l2Key].totalSales += r.totalSales;
       l2Agg[l2Key].net += r.totalProfitLoss;
       l2Agg[l2Key].count += 1;
       if (r.totalProfitLoss > 0) l2Agg[l2Key].profit += r.totalProfitLoss;
       if (r.totalProfitLoss < 0) l2Agg[l2Key].loss += Math.abs(r.totalProfitLoss);
    });

    Object.values(dayRowsMap).forEach(d => {
       if (d.qty > 0) d.profitLossPerUnit = d.totalProfitLoss / d.qty;
    });

    res.json({ 
       dayRows: Object.values(dayRowsMap),
       rangeAggregated: Object.values(rangeAgg),
       hierarchyAggregated: {
           l1: Object.values(l1Agg),
           l2: Object.values(l2Agg)
       }
    });
  } catch(e) {
    console.error("Profit Error:", e);
    res.status(500).json({error: "Failed to generate profit reports"});
  }
});

app.get("/api/reports/finance", (req, res) => {
  const period = (req.query.period as string) || "";
  const finAgg = db
    .prepare(
      `
    SELECT 
      SUM(CASE WHEN json_extract(data, '$.transactionType') LIKE '%خروج%' OR CAST(json_extract(data, '$.amount') AS REAL) < 0 THEN ABS(CAST(json_extract(data, '$.amount') AS REAL)) ELSE 0 END) as outcome,
      SUM(CASE WHEN NOT (json_extract(data, '$.transactionType') LIKE '%خروج%' OR CAST(json_extract(data, '$.amount') AS REAL) < 0) THEN ABS(CAST(json_extract(data, '$.amount') AS REAL)) ELSE 0 END) as income
    FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance'
    AND isInPeriod(json_extract(data, '$.date'), ?) = 1
  `,
    )
    .get(period) as any;

  res.json({
    income: finAgg?.income || 0,
    outcome: finAgg?.outcome || 0,
    marginArr: [],
    agingArr: [],
    breakevenData: null,
  });
});

app.get("/api/export-excel", (req, res) => {
  try {
    const period = (req.query.period as string) || "";
    const mod = (req.query.module as string) || "sales";
    const modFilter = mod === "sales" ? "IN ('sales', 'sales_returns')" : `= '${mod}'`;
    
    // Get all records for this module and period
    const rawIt = db.prepare(`SELECT data as raw_json, f.module_type FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type ${modFilter} AND isInPeriod(json_extract(data, '$.date'), ?) = 1`).iterate(period);
    
    const rows: any[] = [];
    for (const r of rawIt) {
       const item = (r as any);
       const parsed = JSON.parse(item.raw_json || "{}");
       parsed.module_type = item.module_type; // add module type for reference
       rows.push(parsed);
    }
    res.json({ rows });
  } catch(e) {
    console.error("Export Error:", e);
    res.status(500).json({error: "Failed to generate export data"});
  }
});

app.get("/api/reports/hr", (req, res) => {
  const period = (req.query.period as string) || "";
  
  // 1. Fetch Sales Data for efficiency (cashier performance)
  const salesRows = db
    .prepare(
      `
    SELECT 
      coalesce(json_extract(data, '$.cashierCode'), json_extract(data, '$.costCenter'), 'نامشخص') as employee,
      json_extract(data, '$.date') as date,
      json_extract(data, '$.time') as time,
      CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty,
      CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price,
      json_extract(data, '$.invoiceCode') as invCode
    FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'sales'
    AND isInPeriod(json_extract(data, '$.date'), ?) = 1
  `
    )
    .all(period) as any[];

  // 2. Fetch HR (Attendance) Data
  const hrRows = db.prepare(`
    SELECT 
      json_extract(data, '$.personnelCode') as personnelCode,
      json_extract(data, '$.personnelName') as personnelName,
      json_extract(data, '$.role') as role,
      json_extract(data, '$.costCenter') as costCenter,
      json_extract(data, '$.startDate') as startDate,
      json_extract(data, '$.endDate') as endDate,
      json_extract(data, '$.date') as date,
      json_extract(data, '$.entranceTime') as entranceTime,
      json_extract(data, '$.exitTime') as exitTime
    FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'hr'
    AND isInPeriod(json_extract(data, '$.date'), ?) = 1
  `).all(period) as any[];

  // Data maps
  const employeeStats: Record<string, any> = {};
  
  // Helper to init employee
  const initEmp = (id: string, name: string) => {
    if (!employeeStats[id]) {
      employeeStats[id] = {
        code: id,
        name: name,
        role: "نامشخص",
        costCenter: "نامشخص",
        startDate: "",
        endDate: "",
        salesScans: 0,
        salesQty: 0,
        salesValue: 0,
        invoiceCount: new Set(),
        workingDays: 0,
        workingHours: 0,
        missingExit: 0,
        lateArrivals: 0, // hypothetical logic: entered after 09:00
        overtimeHours: 0 // > 8h / day
      };
    }
  };

  // Process HR Attendance
  for (const hr of hrRows) {
    const code = hr.personnelCode || "نامشخص";
    const name = hr.personnelName || code;
    initEmp(code, name);
    
    if (hr.role && employeeStats[code].role === "نامشخص") employeeStats[code].role = hr.role;
    if (hr.costCenter && employeeStats[code].costCenter === "نامشخص") employeeStats[code].costCenter = hr.costCenter;
    if (hr.startDate && !employeeStats[code].startDate) employeeStats[code].startDate = hr.startDate;
    if (hr.endDate && !employeeStats[code].endDate) employeeStats[code].endDate = hr.endDate;

    employeeStats[code].workingDays += 1;

    if (hr.entranceTime && hr.exitTime) {
       const [eh, em] = String(hr.entranceTime).split(":").map(Number);
       const [xh, xm] = String(hr.exitTime).split(":").map(Number);
       if (!isNaN(eh) && !isNaN(xh)) {
          let hours = xh - eh + (xm - em) / 60;
          if (hours < 0) hours += 24; // night shift
          employeeStats[code].workingHours += hours;
          
          if (eh >= 9 && em > 15) {
             employeeStats[code].lateArrivals += 1; // Assuming 09:00 is standard start
          }
          if (hours > 8) {
             employeeStats[code].overtimeHours += (hours - 8);
          }
       }
    } else {
       employeeStats[code].missingExit += 1;
    }
  }

  // Process Sales (Efficiency & Commission)
  for (const s of salesRows) {
    const code = s.employee || "نامشخص";
    initEmp(code, code); // fallback name to code if hr data is missing
    
    employeeStats[code].salesScans += 1;
    employeeStats[code].salesQty += (s.qty || 0);
    employeeStats[code].salesValue += ((s.qty || 0) * (s.price || 0));
    if (s.invCode) employeeStats[code].invoiceCount.add(s.invCode);
  }

  // Overall Org Stats
  const orgStats = {
    totalEmployees: Object.keys(employeeStats).length,
    activeEmployees: 0,
    newJoiners: 0,
    leavers: 0,
    rolesDistribution: {} as Record<string, number>,
    costCenterDistribution: {} as Record<string, number>
  };

  // Finalize data arrays
  const hrAnalytics = Object.values(employeeStats).map((emp: any) => {
    
    // Org Tracking
    if (emp.role && emp.role !== "نامشخص") {
        orgStats.rolesDistribution[emp.role] = (orgStats.rolesDistribution[emp.role] || 0) + 1;
    }
    if (emp.costCenter && emp.costCenter !== "نامشخص") {
        orgStats.costCenterDistribution[emp.costCenter] = (orgStats.costCenterDistribution[emp.costCenter] || 0) + 1;
    }
    
    const isLeaver = !!emp.endDate;
    if (isLeaver) orgStats.leavers++;
    else orgStats.activeEmployees++;

    if (emp.startDate && period === emp.startDate) {
        // This is a naive check; ideally we use an isInPeriod logic on startDate,
        // but for demo, just incrementing if they joined
        orgStats.newJoiners++;
    }

    // commission stats
    const commAmt = emp.salesScans; // we will multiply by rate in frontend
    
    // efficiency stats
    let itemsPerMinute = 0;
    if (emp.workingHours > 0) {
      itemsPerMinute = emp.salesScans / (emp.workingHours * 60);
    } else if (emp.workingDays === 0 && emp.salesScans > 0) {
       // if no hr records but they sold, estimate 8 hours a day for days they sold
       // This is a naive fallback if HR data isn't provided
       itemsPerMinute = emp.salesScans / (8 * 60); 
    }

    // Determine performance score dynamically based on items per minute vs an expected baseline (e.g. 10 items/min is standard)
    let avgPerf = 0;
    if (itemsPerMinute > 0) {
        avgPerf = Math.min(Math.round((itemsPerMinute / 10) * 100), 100);
    }

    return {
      employeeCode: emp.code,
      employeeName: emp.name !== emp.code ? emp.name : emp.code,
      role: emp.role,
      costCenter: emp.costCenter,
      startDate: emp.startDate,
      endDate: emp.endDate,
      active: !isLeaver,
      scans: emp.salesScans,
      salesQty: emp.salesQty,
      salesValue: emp.salesValue,
      invoiceCount: emp.invoiceCount.size,
      workingDays: emp.workingDays,
      workingHours: Number(emp.workingHours.toFixed(1)),
      lateArrivals: emp.lateArrivals,
      overtimeHours: Number(emp.overtimeHours.toFixed(1)),
      missingExit: emp.missingExit,
      itemsPerMinute: Number(itemsPerMinute.toFixed(2)),
      perfScore: Number(avgPerf.toFixed(1)),
      basketSize: emp.invoiceCount.size > 0 ? Number((emp.salesQty / emp.invoiceCount.size).toFixed(1)) : 0,
      basketValue: emp.invoiceCount.size > 0 ? Number((emp.salesValue / emp.invoiceCount.size).toFixed(0)) : 0,
    };
  }).sort((a, b) => b.scans - a.scans);

  // Time-based traffic vs headcount (Weekly/Monthly view simulation)
  // For simplicity, aggregate sales by date to form trend
  const dateMap: Record<string, { date: string; salesAmt: number; txCount: number }> = {};
  for (const s of salesRows) {
     if (!s.date) continue;
     if (!dateMap[s.date]) dateMap[s.date] = { date: s.date, salesAmt: 0, txCount: 0 };
     dateMap[s.date].salesAmt += ((s.qty||0)*(s.price||0));
     dateMap[s.date].txCount += 1;
  }
  const trendArr = Object.values(dateMap).sort((a,b)=>a.date.localeCompare(b.date));

  // Hourly Workload (Shift Optimization)
  const hourlyTraffic: Record<number, { hour: string; txCount: number; staffHours: number; salesValue: number }> = {};
  for(let i=0; i<24; i++) hourlyTraffic[i] = { hour: `${i.toString().padStart(2, '0')}:00`, txCount: 0, staffHours: 0, salesValue: 0 };

  for (const s of salesRows) {
      if (s.time) {
          let h = parseInt(String(s.time).split(':')[0]);
          if (!isNaN(h) && h >= 0 && h < 24) {
              hourlyTraffic[h].txCount += 1;
              hourlyTraffic[h].salesValue += (s.price || 0) * (s.qty || 0);
          }
      }
  }

  for (const hr of hrRows) {
      if (hr.entranceTime && hr.exitTime) {
          const [eh, em] = String(hr.entranceTime).split(':').map(Number);
          const [xh, xm] = String(hr.exitTime).split(':').map(Number);
          if (!isNaN(eh) && !isNaN(xh)) {
              let start = eh;
              let end = xh;
              if (end < start) end += 24;
              for(let h = start; h <= end; h++) {
                  hourlyTraffic[h % 24].staffHours += 1;
              }
          }
      }
  }
  
  const hourlyArr = Object.values(hourlyTraffic);

  // Overall KPIs
  const totalSalesValue = salesRows.reduce((acc, s) => acc + ((s.qty || 0) * (s.price || 0)), 0);
  const totalStaffHours = Object.values(employeeStats).reduce((acc: any, emp: any) => acc + emp.workingHours, 0);
  const totalTransactions = salesRows.length;
  
  const kpis = {
    revenuePerStaffHour: totalStaffHours > 0 ? totalSalesValue / totalStaffHours : 0,
    txPerStaffHour: totalStaffHours > 0 ? totalTransactions / totalStaffHours : 0,
    totalWorkingHours: totalStaffHours,
    overtimeRatio: totalStaffHours > 0 ? (Object.values(employeeStats).reduce((acc: any, emp: any) => acc + emp.overtimeHours, 0) / totalStaffHours) * 100 : 0
  };

  res.json({ 
    hrAnalytics,
    trendArr,
    hourlyArr,
    kpis,
    orgStats
  });
});

app.get("/api/reports/advanced-bi", (req, res) => {
  try {
    const period = (req.query.period as string) || "";

    // 1. Products base mapping
    const products = db.prepare("SELECT json_extract(data, '$.productCode') as code, json_extract(data, '$.productName') as name, json_extract(data, '$.mainGroup') as mainGrp, json_extract(data, '$.subGroup') as subGrp FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'products'").all() as any[];
    const pMap: Record<string, any> = {};
    for (const p of products) {
       if (p.code) {
         pMap[p.code] = { 
           name: p.name || 'نامشخص', 
           mainGrp: p.mainGrp || 'سایر', 
           subGrp: p.subGrp || 'سایر' 
         };
       }
    }

    // 2. Weekday Sales Density Analysis
    const salesData = db.prepare(`
      SELECT 
        json_extract(data, '$.date') as date,
        CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty,
        CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price,
        f.module_type
      FROM raw_data r JOIN files f ON r.file_id = f.id
      WHERE f.module_type IN ('sales', 'sales_returns')
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
    `).all(period) as any[];

    const weekdayMap: Record<string, { name: string; salesAmt: number; txCount: number }> = {
      "شنبه": { name: "شنبه", salesAmt: 0, txCount: 0 },
      "یکشنبه": { name: "یکشنبه", salesAmt: 0, txCount: 0 },
      "دوشنبه": { name: "دوشنبه", salesAmt: 0, txCount: 0 },
      "سه‌شنبه": { name: "سه‌شنبه", salesAmt: 0, txCount: 0 },
      "چهارشنبه": { name: "چهارشنبه", salesAmt: 0, txCount: 0 },
      "پنجشنبه": { name: "پنجشنبه", salesAmt: 0, txCount: 0 },
      "جمعه": { name: "جمعه", salesAmt: 0, txCount: 0 },
    };

    function getJalaaliWeekday(dateStr: string): string {
      const weekdays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
      try {
        if (!dateStr || typeof dateStr !== "string") return "شنبه";
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const jy = parseInt(parts[0], 10);
          const jm = parseInt(parts[1], 10);
          const jd = parseInt(parts[2], 10);
          const g = jalaali.toGregorian(jy, jm, jd);
          const gd = new Date(g.gy, g.gm - 1, g.gd);
          return weekdays[gd.getDay()];
        }
      } catch (e) {}
      return "شنبه";
    }

    for (const s of salesData) {
      if (!s.date) continue;
      const day = getJalaaliWeekday(s.date);
      const isReturn = s.module_type === "sales_returns";
      const q = s.qty || 0;
      const p = s.price || 0;
      const amt = q * p * (isReturn ? -1 : 1);

      if (weekdayMap[day]) {
        weekdayMap[day].salesAmt += amt;
        if (!isReturn) {
          weekdayMap[day].txCount += 1;
        }
      }
    }
    const weekdayArr = Object.values(weekdayMap);

    // 3. Basket Pairing Analysis (Market Basket Analysis)
    const rawSalesInvs = db.prepare(`
      SELECT 
        json_extract(data, '$.invoiceCode') as invCode,
        json_extract(data, '$.productName') as pName,
        json_extract(data, '$.productCode') as pCode
      FROM raw_data r JOIN files f ON r.file_id = f.id
      WHERE f.module_type = 'sales'
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
    `).all(period) as any[];

    const invItems: Record<string, string[]> = {};
    for (const item of rawSalesInvs) {
      if (!item.invCode || (!item.pName && !item.pCode)) continue;
      const displayName = item.pName || (pMap[item.pCode]?.name) || item.pCode;
      if (!invItems[item.invCode]) invItems[item.invCode] = [];
      if (!invItems[item.invCode].includes(displayName)) {
        invItems[item.invCode].push(displayName);
      }
    }

    const itemPairCounts: Record<string, { p1: string; p2: string; count: number }> = {};
    for (const items of Object.values(invItems)) {
      if (items.length < 2) continue;
      const limited = items.slice(0, 15); // cap to avoid excessive loops
      for (let i = 0; i < limited.length; i++) {
        for (let j = i + 1; j < limited.length; j++) {
          const pair = limited[i] < limited[j] ? [limited[i], limited[j]] : [limited[j], limited[i]];
          const pKey = `${pair[0]}::${pair[1]}`;
          if (!itemPairCounts[pKey]) {
            itemPairCounts[pKey] = { p1: pair[0], p2: pair[1], count: 0 };
          }
          itemPairCounts[pKey].count += 1;
        }
      }
    }
    const basketPairs = Object.values(itemPairCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Supplier Performance & Procurement
    const purchasesData = db.prepare(`
      SELECT 
        json_extract(data, '$.supplier') as supplier,
        CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) as qty,
        CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) as price,
        f.module_type
      FROM raw_data r JOIN files f ON r.file_id = f.id
      WHERE f.module_type IN ('purchases', 'purchase_returns')
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
    `).all(period) as any[];

    const supplierMap: Record<string, { name: string; purchaseAmt: number; returnAmt: number; returnQty: number; purchaseQty: number }> = {};
    for (const pur of purchasesData) {
      const sup = pur.supplier || "ذینفع نامشخص";
      if (!supplierMap[sup]) {
        supplierMap[sup] = { name: sup, purchaseAmt: 0, returnAmt: 0, returnQty: 0, purchaseQty: 0 };
      }
      const q = pur.qty || 0;
      const p = pur.price || 0;
      const amt = q * p;
      if (pur.module_type === "purchases") {
        supplierMap[sup].purchaseAmt += amt;
        supplierMap[sup].purchaseQty += q;
      } else {
        supplierMap[sup].returnAmt += amt;
        supplierMap[sup].returnQty += q;
      }
    }
    const supplierArr = Object.values(supplierMap).map(sup => {
      const returnRate = sup.purchaseAmt > 0 ? (sup.returnAmt / sup.purchaseAmt) * 100 : 0;
      return {
        ...sup,
        returnRate: parseFloat(returnRate.toFixed(2)),
        netPurchase: sup.purchaseAmt - sup.returnAmt,
      };
    }).sort((a,b) => b.netPurchase - a.netPurchase);

    // 5. Smart Stock Reconciliation (کسری و کنترل مغایرت انبار)
    // Starting balance (Opening Stock)
    const openingStock = db.prepare(`
      SELECT 
        json_extract(data, '$.productCode') as code,
        SUM(CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL)) as qty
      FROM raw_data r JOIN files f ON r.file_id = f.id
      WHERE f.module_type = 'opening_inventory'
      GROUP BY code
    `).all() as any[];
    const openMap: Record<string, number> = {};
    for (const op of openingStock) {
      if (op.code) openMap[op.code] = op.qty || 0;
    }

    // Procurement net by product
    const prodPurch = db.prepare(`
      SELECT 
        json_extract(data, '$.productCode') as code,
        SUM(CASE WHEN f.module_type = 'purchases' THEN CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) ELSE -CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) END) as qty,
        SUM(CASE WHEN f.module_type = 'purchases' THEN CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) ELSE 0 END) as totalAmt
      FROM raw_data r JOIN files f ON r.file_id = f.id
      WHERE f.module_type IN ('purchases', 'purchase_returns')
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
      GROUP BY code
    `).all(period) as any[];
    const purchMap: Record<string, { qty: number; amt: number }> = {};
    for (const pc of prodPurch) {
      if (pc.code) purchMap[pc.code] = { qty: pc.qty || 0, amt: pc.totalAmt || 0 };
    }

    // Sales net by product
    const prodSales = db.prepare(`
      SELECT 
        json_extract(data, '$.productCode') as code,
        json_extract(data, '$.productName') as name,
        SUM(CASE WHEN f.module_type = 'sales' THEN CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) ELSE -CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) END) as qty,
        SUM(CASE WHEN f.module_type = 'sales' THEN CAST(REPLACE(json_extract(data, '$.quantity'), ',', '') AS REAL) * CAST(coalesce(json_extract(data, '$.totalPrice'), json_extract(data, '$.price')) AS REAL) ELSE 0 END) as totalAmt
      FROM raw_data r JOIN files f ON r.file_id = f.id
      WHERE f.module_type IN ('sales', 'sales_returns')
      AND isInPeriod(json_extract(data, '$.date'), ?) = 1
      GROUP BY code
    `).all(period) as any[];

    const reconciliationList: any[] = [];
    for (const sl of prodSales) {
      if (!sl.code) continue;
      const code = sl.code;
      const name = sl.name || pMap[code]?.name || 'کالای فرضی';
      const pInfo = pMap[code] || { mainGrp: 'سایر', subGrp: 'سایر' };
      const openQty = openMap[code] || 0;
      const pRec = purchMap[code] || { qty: 0, amt: 0 };
      const sQty = sl.qty || 0;
      const sAmt = sl.totalAmt || 0;

      const expectedEnding = openQty + pRec.qty - sQty;
      
      // Calculate variance signal (potential stock shrink/loss)
      let status = "تطبیق کامل";
      if (expectedEnding < 0) {
        status = "انحراف کسر انبار / فروش بیش از موجودی";
      } else if (expectedEnding > 0 && sQty === 0) {
        status = "راکد انبار";
      } else if (sQty > 0 && expectedEnding < sQty * 0.1) {
        status = "نیاز به شارژ بحرانی";
      }

      reconciliationList.push({
        code,
        name,
        category: pInfo.mainGrp,
        openingQty: openQty,
        purchQty: pRec.qty,
        salesQty: sQty,
        salesAmt: sAmt,
        expectedQty: expectedEnding,
        status,
      });
    }

    res.json({
      weekdayArr,
      basketPairs,
      supplierArr,
      reconciliationList: reconciliationList.slice(0, 50),
    });
  } catch (error: any) {
    console.error("Advanced BI Report Error:", error);
    res.status(500).json({ error: "خطا در بارگذاری گزارشات تخصصی مدیریت: " + error.message });
  }
});

// 4. Delete File and its Data
app.delete("/api/files/:id", (req, res) => {
  const fileId = req.params.id;

  // Get filename to delete from disk
  const fileRecord = db
    .prepare("SELECT filename FROM files WHERE id = ?")
    .get(fileId) as { filename: string } | undefined;

  if (fileRecord) {
    const filePath = path.join(UPLOADS_DIR, fileRecord.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Delete from DB (CASCADE will handle raw_data)
  db.prepare("DELETE FROM files WHERE id = ?").run(fileId);
  res.json({ message: "فایل حذف شد." });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
