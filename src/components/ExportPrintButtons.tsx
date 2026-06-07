import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { exportToExcel, printView } from '../utils/exportUtils';

interface ExportPrintButtonsProps {
  data?: any[];
  fileName?: string;
  onExport?: () => void;
  // If data is not directly provided but raw module data is needed
  moduleName?: string;
  period?: string;
}

export default function ExportPrintButtons({ data, fileName, onExport, moduleName, period }: ExportPrintButtonsProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (onExport) {
      onExport();
    } else if (moduleName) {
      setExporting(true);
      try {
        const q = new URLSearchParams();
        if (period) q.set('period', period);
        q.set('module', moduleName);
        
        const res = await fetch('/api/export-excel?' + q.toString());
        const json = await res.json();
        if (json.rows && json.rows.length > 0) {
           exportToExcel(json.rows, fileName || `${moduleName}_export`);
        } else {
           alert("داده‌ای برای خروجی وجود ندارد.");
        }
      } catch (e) {
        console.error("Export failed", e);
        alert("خطا در تهیه خروجی اکسل");
      } finally {
        setExporting(false);
      }
    } else if (data && fileName) {
      exportToExcel(data, fileName);
    }
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors border border-emerald-200 shadow-sm disabled:opacity-50"
        title="خروجی کامل اکسل"
      >
        <Download size={16} className="text-emerald-500" />
        <span className="hidden sm:inline">
           {exporting ? "در حال پردازش..." : "خروجی اکسل"}
        </span>
      </button>
      <button
        onClick={printView}
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors border border-slate-200 shadow-sm"
        title="چاپ تمام صفحه"
      >
        <Printer size={16} className="text-slate-500" />
        <span className="hidden sm:inline">چاپ</span>
      </button>
    </div>
  );
}
