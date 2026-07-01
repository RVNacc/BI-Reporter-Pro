import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Download } from "lucide-react";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

const formatRial = (v: number) => Number(v || 0).toLocaleString() + " ریال";
const formatQty = (v: number) => Number(v || 0).toLocaleString();

export function WeeklyReportsView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("");
  const [netMode, setNetMode] = useState(true);
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
  }, [period, netMode]);

  const handleExportCSV = () => {
     if (!data || !data.rows || !data.weeks) return;
     let csv = "سطح ۱,سطح ۲,مرکز فعالیت";
     const weeksContent = data.weeks.map((w: number) => `هفته ${w} - رشد,هفته ${w} - ${mode === "amt" ? "ریال" : "تعداد"}`).join(",");
     csv += "," + weeksContent + "\n";

     rows.forEach((row: any) => {
         let line = `"${row.l1}","${row.l2}","${row.ac}"`;
         data.weeks.forEach((w: number) => {
             const g = mode === "amt" ? row.wAmt[`g${w}`] : row.wQty[`g${w}`];
             const val = mode === "amt" ? row.wAmt[`w${w}`] : row.wQty[`w${w}`];
             const gVal = w > 1 ? (g * 100).toFixed(0) + '%' : '-';
             line += `,"${gVal}","${val || 0}"`;
         });
         csv += line + "\n";
     });

     const encodeUri = encodeURI("data:text/csv;charset=utf-8," + csv);
     const link = document.createElement("a");
     link.setAttribute("href", encodeUri);
     link.setAttribute("download", `گزارش_روند_هفتگی_${period || 'کل'}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
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
          <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium border border-emerald-200 transition-colors"
          >
             <Download size={16} />
             <span>خروجی اکسل</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          <div className="h-[450px] border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col">
             <h4 className="text-center font-bold text-sm text-slate-600 mb-2 shrink-0">روند کل {mode === 'amt' ? 'ریالی' : 'تعدادی'} (لاین)</h4>
             <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="weekName" {...defaultXAxisProps}  />
                        <YAxis {...defaultYAxisProps} />
                        <RechartsTooltip formatter={(v:number)=> mode === 'amt' ? formatRial(v) : formatQty(v)}/>
                        <Line type="monotone" dataKey={mode === 'amt' ? 'netAmt' : 'netQty'} stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                 </ResponsiveContainer>
             </div>
          </div>
          <div className="h-[450px] border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col">
             <h4 className="text-center font-bold text-sm text-slate-600 mb-2 shrink-0">مجموع {mode === 'amt' ? 'ریالی' : 'تعدادی'} کل (ستون)</h4>
             <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="weekName" {...defaultXAxisProps}  />
                        <YAxis {...defaultYAxisProps} />
                        <RechartsTooltip formatter={(v:number)=> mode === 'amt' ? formatRial(v) : formatQty(v)}/>
                        <Bar dataKey={mode === 'amt' ? 'netAmt' : 'netQty'} fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                 </ResponsiveContainer>
             </div>
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
            <table className="w-full text-right text-xs md:text-sm whitespace-nowrap table-auto print:font-medium">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b print:border-black print:border-b-2 print:bg-white print:text-black">
                 <tr>
                    <th className="p-2 border-l border-slate-200 print:border-l-black border-b print:border-b-black text-center align-middle" rowSpan={2}>سطح ۱</th>
                    <th className="p-2 border-l border-slate-200 print:border-l-black border-b print:border-b-black text-center align-middle" rowSpan={2}>سطح ۲</th>
                    <th className="p-2 border-l border-slate-200 print:border-l-black border-b print:border-b-black text-center align-middle" rowSpan={2}>مرکز فعالیت</th>
                    <th className="p-2 border-b text-center border-slate-300 print:border-b-black text-slate-800 print:text-black" colSpan={data.weeks.length * 2}>
                        هفته (قدیمی‌ترین به جدیدترین)
                    </th>
                 </tr>
                 <tr>
                    {data.weeks.map((w: number) => (
                       <React.Fragment key={w}>
                          <th className="p-1 px-2 border-l border-b border-t border-slate-200 print:border-l-black print:border-b-black text-center text-[11px] md:text-[13px]">
                             <span className="block text-white select-none">-</span>
                             <span>{mode === 'amt' ? 'ریال' : 'تعداد'}</span>
                          </th>
                          <th className="p-1 px-2 border-l border-b border-t border-slate-200 print:border-l-black print:border-b-black text-center text-[11px] md:text-[13px] bg-slate-50/50">
                             <span className="block text-slate-400 font-normal">هفته {w}</span>
                             <span>رشد (%)</span>
                          </th>
                       </React.Fragment>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-black text-slate-700 print:text-black">
                 {rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent print:break-inside-avoid">
                       <td className="p-2 border-l border-slate-200 print:border-l-black text-right whitespace-normal break-words w-[120px] max-w-[120px] print:w-auto print:max-w-none">{row.l1}</td>
                       <td className="p-2 border-l border-slate-200 print:border-l-black text-right whitespace-normal break-words w-[120px] max-w-[120px] print:w-auto print:max-w-none">{row.l2}</td>
                       <td className="p-2 border-l border-slate-200 print:border-l-black text-right whitespace-normal break-words w-[100px] max-w-[100px] print:w-auto print:max-w-none text-[13px] font-bold">{row.ac}</td>
                       {data.weeks.map((w: number) => {
                           const val = mode === "amt" ? row.wAmt[`w${w}`] : row.wQty[`w${w}`];
                           const g = mode === "amt" ? row.wAmt[`g${w}`] : row.wQty[`g${w}`];
                           const gVal = (g * 100).toFixed(0) + '%';
                           
                           let gColor = "text-slate-500";
                           if (g > 0) gColor = "text-emerald-500 font-medium print:text-black";
                           else if (g < 0) gColor = "text-rose-500 font-medium print:text-black";
                           else gColor = "text-slate-400 print:text-black";

                           return (
                               <React.Fragment key={w}>
                                  <td className="p-1.5 px-2 border-l border-slate-200 print:border-l-black align-middle text-center font-bold text-[13px] text-slate-800 print:text-black bg-slate-50/30">
                                     {val ? Number(val.toFixed(0)).toLocaleString() : '0'}
                                  </td>
                                  <td className={`p-1.5 px-2 border-l border-slate-200 border-dashed print:border-l-black align-middle text-center text-[12px] font-bold ${gColor} print:text-black bg-slate-50/10`}>
                                     {w > 1 ? gVal : '-'}
                                  </td>
                               </React.Fragment>
                           )
                       })}
                    </tr>
                 ))}
                 {rows.length === 0 && (
                    <tr>
                       <td colSpan={data.weeks.length * 2 + 3} className="p-8 text-center text-slate-500">
                          رکوردی یافت نشد.
                       </td>
                    </tr>
                 )}
              </tbody>
            </table>
        </div>
      </div>

      {data.movers && data.weeks.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden mt-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 text-emerald-600 flex items-center justify-between">
                 بیشترین رشد نسبی (هفته {data.weeks[data.weeks.length-1]} به {data.weeks[data.weeks.length-2]})
                 <span className="text-xs font-normal text-slate-500">{(mode === 'amt' ? "ریالی" : "تعدادی")}</span>
              </h3>
              <div className="overflow-y-auto max-h-[450px]">
                 <ul className="space-y-2">
                    {data.movers[mode === 'amt' ? 'topGrowersAmt' : 'topGrowersQty'].slice(0,10).map((m: any, i: number) => (
                        <li key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                           <span className="text-slate-700 truncate w-2/3" title={m.name}>{i+1}. {m.name}</span>
                           <span className="font-bold text-emerald-600">+{mode === 'amt' ? formatRial(m.diffAmt) : formatQty(m.diffQty)}</span>
                        </li>
                    ))}
                    {data.movers[mode === 'amt' ? 'topGrowersAmt' : 'topGrowersQty'].length === 0 && <div className="text-center text-slate-500 py-4">موردی یافت نشد</div>}
                 </ul>
              </div>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 text-rose-600 flex items-center justify-between">
                 بیشترین افت نسبی (هفته {data.weeks[data.weeks.length-1]} به {data.weeks[data.weeks.length-2]})
                 <span className="text-xs font-normal text-slate-500">{(mode === 'amt' ? "ریالی" : "تعدادی")}</span>
              </h3>
              <div className="overflow-y-auto max-h-[450px]">
                 <ul className="space-y-2">
                    {data.movers[mode === 'amt' ? 'topDeclinersAmt' : 'topDeclinersQty'].slice(0,10).map((m: any, i: number) => (
                        <li key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded border-r-2 border-r-rose-400">
                           <span className="text-slate-700 truncate w-2/3" title={m.name}>{i+1}. {m.name}</span>
                           <span className="font-bold text-rose-600">{mode === 'amt' ? formatRial(m.diffAmt) : formatQty(m.diffQty)}</span>
                        </li>
                    ))}
                    {data.movers[mode === 'amt' ? 'topDeclinersAmt' : 'topDeclinersQty'].length === 0 && <div className="text-center text-slate-500 py-4">موردی یافت نشد</div>}
                 </ul>
              </div>
           </div>
        </div>
      )}

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
            .print\\:font-medium { font-family: monospace, sans-serif !important; }
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
