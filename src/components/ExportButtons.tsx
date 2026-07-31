import React from 'react';
import * as XLSX from 'xlsx';
import { Printer, FileSpreadsheet } from 'lucide-react';

interface ExportButtonsProps {
  data: any[];
  filename: string;
  className?: string;
}

export default function ExportButtons({ data, filename, className = "" }: ExportButtonsProps) {
  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("داده ای برای خروجی وجود ندارد.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex gap-2 no-print ${className}`}>
      <button 
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        <FileSpreadsheet size={16} />
        <span>خروجی اکسل</span>
      </button>
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm"
      >
        <Printer size={16} />
        <span>چاپ / PDF</span>
      </button>
    </div>
  );
}
