import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton({ title = "چاپ گزارش" }: { title?: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button 
      onClick={handlePrint}
      className="print:hidden text-sm bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-slate-50 transition shadow-sm"
    >
      <Printer size={16} className="text-slate-500" />
      {title}
    </button>
  );
}
