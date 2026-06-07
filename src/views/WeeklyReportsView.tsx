import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

import ExportPrintButtons from "../components/ExportPrintButtons";

const formatRial = (v: number) => Number(v || 0).toLocaleString() + " ریال";
const formatQty = (v: number) => Number(v || 0).toLocaleString();

export function WeeklyReportsView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("");
  const [periods, setPeriods] = useState<any[]>([]);
  const [mode, setMode] = useState<"amt" | "qty">("amt"); // ریالی یا تعدادی
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/api/periods')
      .then(res => res.json())
      .then(resData => setPeriods(resData));
  }, []);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/reports/weekly?period=${period}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (period || period === "") {
       fetchData();
    }
  }, [period]);

  const handlePrint = () => {
     window.print();
  };

  if (!data) return <div className="p-6 text-slate-500">در حال بارگذاری...</div>;
  if (data.error) return <div className="p-6 text-rose-500">خطا: {data.error}</div>;
  if (!data.rows || !data.weeks) return <div className="p-6 text-slate-500">داده‌ای یافت نشد.</div>;

  const rows = data.rows.filter((r: any) => 
     (r.l1 || "").includes(search) || (r.l2 || "").includes(search) || (r.ac || "").includes(search)
  );

  // Group chart data by week
  let chartData: any[] = [];
  data.weeks.slice().reverse().forEach((w: number) => {
      let totalAmt = 0;
      let totalQty = 0;
      rows.forEach((r: any) => {
          totalAmt += r.wAmt[`w${w}`] || 0;
          totalQty += r.wQty[`w${w}`] || 0;
      });
      chartData.push({
          weekName: `هفته ${w}`,
          netAmt: totalAmt,
          netQty: totalQty
      });
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">گزارش روند فروش هفتگی</h2>
          <p className="text-sm text-slate-500 mt-1">مقایسه فروش در هفته‌های مختلف</p>
        </div>
        <div className="flex items-center gap-3">
          <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
          <div className="bg-slate-100 p-1 flex rounded-lg">
             <button onClick={() => setMode("amt")} className={`px-4 py-1.5 text-sm rounded ${mode === "amt" ? "bg-white shadow text-blue-600 font-medium" : "text-slate-600 hover:text-slate-800"}`}>ریالی</button>
             <button onClick={() => setMode("qty")} className={`px-4 py-1.5 text-sm rounded ${mode === "qty" ? "bg-white shadow text-blue-600 font-medium" : "text-slate-600 hover:text-slate-800"}`}>تعدادی</button>
          </div>
          <ExportPrintButtons moduleName="sales" period={period} fileName="Weekly_Report" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          <div className="h-80 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
             <h4 className="text-center font-bold text-sm text-slate-600 mb-2">روند کل {mode === 'amt' ? 'ریالی' : 'تعدادی'} (لاین)</h4>
             <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{top:10, left:20, right:20, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="weekName" angle={-90} textAnchor="start" height={100} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip formatter={(v:number)=> mode === 'amt' ? formatRial(v) : formatQty(v)}/>
                    <Line type="monotone" dataKey={mode === 'amt' ? 'netAmt' : 'netQty'} stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                 </LineChart>
             </ResponsiveContainer>
          </div>
          <div className="h-80 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
             <h4 className="text-center font-bold text-sm text-slate-600 mb-2">مجموع {mode === 'amt' ? 'ریالی' : 'تعدادی'} کل (ستون)</h4>
             <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{top:10, left:20, right:20, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="weekName" angle={-90} textAnchor="start" height={100} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip formatter={(v:number)=> mode === 'amt' ? formatRial(v) : formatQty(v)}/>
                    <Bar dataKey={mode === 'amt' ? 'netAmt' : 'netQty'} fill="#10b981" radius={[4,4,0,0]} />
                 </BarChart>
             </ResponsiveContainer>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible print:border-black print:rounded-none print:shadow-none">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
            <h3 className="font-bold text-slate-700">جدول روند {mode === 'amt' ? 'ریالی' : 'تعدادی'} هفتگی</h3>
            <div className="w-1/3">
              <input type="text" placeholder="جستجوی گروه، رده یا مرکز..." className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full outline-none focus:border-blue-500" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
        </div>
        <div className="overflow-x-auto print:overflow-visible w-full">
            <table className="w-full text-right text-xs md:text-sm whitespace-nowrap table-auto print:font-mono">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b print:border-black print:border-b-2 print:bg-white print:text-black">
                 <tr>
                    <th className="p-2 border-l border-slate-200 print:border-l-black border-b print:border-b-black text-center align-middle" rowSpan={2}>سطح ۱</th>
                    <th className="p-2 border-l border-slate-200 print:border-l-black border-b print:border-b-black text-center align-middle" rowSpan={2}>سطح ۲</th>
                    <th className="p-2 border-l border-slate-200 print:border-l-black border-b print:border-b-black text-center align-middle" rowSpan={2}>مرکز فعالیت</th>
                    <th className="p-2 border-b text-center border-slate-300 print:border-b-black text-slate-800 print:text-black" colSpan={data.weeks.length}>
                        هفته (جدیدترین به قدیمی‌ترین)
                    </th>
                 </tr>
                 <tr>
                    {data.weeks.map((w: number) => (
                       <th key={w} className="p-0 border-l border-b border-slate-200 print:border-l-black print:border-b-black">
                          <div className="flex flex-col text-center divide-y divide-slate-200 print:divide-black">
                             <span className="py-1.5 bg-slate-50 print:bg-white font-bold">{w}</span>
                             <div className="flex divide-x divide-x-reverse divide-slate-200 print:divide-black text-[10px] md:text-[11px] text-slate-500 print:text-black">
                                <span className="flex-1 w-1/2 py-1 px-1">رشد (%)</span>
                                <span className="flex-1 w-1/2 py-1 px-1">{mode === 'amt' ? 'ریال' : 'تعداد'}</span>
                             </div>
                          </div>
                       </th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-black text-slate-700 print:text-black">
                 {rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent print:break-inside-avoid">
                       <td className="p-2 border-l border-slate-200 print:border-l-black whitespace-normal break-words w-[120px] max-w-[120px] print:w-auto print:max-w-none">{row.l1}</td>
                       <td className="p-2 border-l border-slate-200 print:border-l-black whitespace-normal break-words w-[120px] max-w-[120px] print:w-auto print:max-w-none">{row.l2}</td>
                       <td className="p-2 border-l border-slate-200 print:border-l-black whitespace-normal break-words w-[100px] max-w-[100px] print:w-auto print:max-w-none text-[11px]">{row.ac}</td>
                       {data.weeks.map((w: number) => {
                           const val = mode === "amt" ? row.wAmt[`w${w}`] : row.wQty[`w${w}`];
                           const g = mode === "amt" ? row.wAmt[`g${w}`] : row.wQty[`g${w}`];
                           const gVal = (g * 100).toFixed(0) + '%';
                           let gColor = "text-slate-500";
                           // For print we want just normal text, maybe let it stay black since print:text-black overrides
                           if (g > 0) gColor = "text-emerald-500 font-medium print:text-black";
                           else if (g < 0) gColor = "text-rose-500 font-medium print:text-black";
                           else gColor = "text-slate-400 print:text-black";

                           return (
                               <td key={w} className="p-0 border-l border-slate-200 print:border-l-black align-middle text-center">
                                  <div className="flex divide-x divide-x-reverse divide-slate-100 print:divide-black h-full min-h-[36px]">
                                     <span className={`w-1/2 p-1.5 text-center text-[11px] flex items-center justify-center ${gColor} print:text-black`}>
                                        {w > 1 ? gVal : '-'}
                                     </span>
                                     <span className="w-1/2 p-1.5 text-center flex items-center justify-center font-mono text-[11px] font-medium text-slate-800 print:text-black">
                                        {val ? Number(val.toFixed(0)).toLocaleString() : '0'}
                                     </span>
                                  </div>
                               </td>
                           )
                       })}
                    </tr>
                 ))}
                 {rows.length === 0 && (
                    <tr>
                       <td colSpan={data.weeks.length + 3} className="p-8 text-center text-slate-500">
                          رکوردی یافت نشد.
                       </td>
                    </tr>
                 )}
              </tbody>
            </table>
        </div>
      </div>
      
      {/* CSS for printing */}
      <style>{`
        @media print {
            @page {
               size: A3 landscape;
               margin: 15mm;
            }
            body {
               background: #fff;
               color: #000;
            }
            .print\\:hidden { display: none !important; }
            .print\\:text-black { color: #000 !important; }
            .print\\:block { display: block !important; }
            .print\\:overflow-visible { overflow: visible !important; }
            .print\\:font-mono { font-family: monospace, sans-serif !important; }
            .print\\:border-black { border-color: #000 !important; border-width: 1px !important; }
            .print\\:border-l-black { border-left-color: #000 !important; border-left-width: 1px !important;}
            .print\\:border-b-black { border-bottom-color: #000 !important; border-bottom-width: 1px !important;}
            .print\\:bg-white { background-color: #fff !important; }
            .print\\:divide-black > :not([hidden]) ~ :not([hidden]) {
                border-color: #000 !important;
            }
            
            table {
                width: 100% !important;
                border: 1px solid #000 !important;
                border-collapse: collapse !important;
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 2px !important;
                font-size: 8px !important;
            }
        }
      `}</style>
    </div>
  );
}
