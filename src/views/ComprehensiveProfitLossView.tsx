import React, { useState, useEffect } from 'react';
import ExportPrintButtons from '../components/ExportPrintButtons';

export default function ComprehensiveProfitLossView() {
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'top_profit' | 'top_loss'>('all');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comprehensive-profit?period=${period}`);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('Not an array');
      setData(json);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const processedData = data.map(row => {
    const cogs = (row.salesQty || 0) * (row.unitCost || 0);
    const profit = (row.netSales || 0) - cogs;
    const marg = row.netSales > 0 ? (profit / row.netSales) * 100 : 0;
    return { ...row, cogs, profit, marg };
  });

  let displayData = processedData;
  if (activeTab === 'top_profit') {
    displayData = [...processedData].filter(d => d.profit > 0).sort((a, b) => b.profit - a.profit).slice(0, 100);
  } else if (activeTab === 'top_loss') {
    displayData = [...processedData].filter(d => d.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 100);
  }

  const totalSales = data.reduce((acc, row) => acc + (row.netSales || 0), 0);
  const totalCogs = data.reduce((acc, row) => acc + ((row.salesQty || 0) * (row.unitCost || 0)), 0);
  const totalGrossProfit = totalSales - totalCogs;
  const margin = totalSales > 0 ? (totalGrossProfit / totalSales) * 100 : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">سود و زیان (جامع)</h1>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="دوره (مثلا 1403)" 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-md">بروزرسانی</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm mb-1">فروش خالص</div>
            <div className="text-xl font-bold">{totalSales.toLocaleString()}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm mb-1">بهای تمام شده کالای فروش رفته</div>
            <div className="text-xl font-bold">{totalCogs.toLocaleString()}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm mb-1">سود ناخالص</div>
            <div className="text-xl font-bold">{totalGrossProfit.toLocaleString()}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm mb-1">حاشیه سود ناخالص</div>
            <div className="text-xl font-bold" dir="ltr">{margin.toFixed(2)}%</div>
         </div>
      </div>

      <div className="mb-4 flex space-x-2 space-x-reverse border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('all')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          همه کالاها
        </button>
        <button 
          onClick={() => setActiveTab('top_profit')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'top_profit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          ۱۰۰ کالای پرسود
        </button>
        <button 
          onClick={() => setActiveTab('top_loss')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'top_loss' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          ۱۰۰ کالای زیان‌ده
        </button>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">جزئیات سود و زیان</h3>
          <ExportPrintButtons data={data} fileName="سود_و_زیان_جامع" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
             <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 border-b">
                   <tr>
                     <th className="p-3">ردیف</th>
                     <th className="p-3">کد کالا</th>
                     <th className="p-3">نام کالا</th>
                     <th className="p-3">تعداد فروش</th>
                     <th className="p-3">نرخ فروش خالص (واحد)</th>
                     <th className="p-3">فروش خالص</th>
                     <th className="p-3">بهای تمام شده واحد (میانگین)</th>
                     <th className="p-3">بهای تمام شده کل</th>
                     <th className="p-3">سود/زیان ناخالص</th>
                     <th className="p-3">حاشیه سود</th>
                   </tr>
                </thead>
                <tbody>
                   {displayData.map((row: any, i: number) => {
                     return (
                       <tr key={i} className="border-b hover:bg-slate-50">
                         <td className="p-3 text-slate-500">{i + 1}</td>
                         <td className="p-3">{row.code}</td>
                         <td className="p-3">{row.name}</td>
                         <td className="p-3">{row.salesQty?.toLocaleString()}</td>
                         <td className="p-3 font-medium text-blue-600">{row.salesQty > 0 ? Math.round(row.netSales / row.salesQty).toLocaleString() : 0}</td>
                         <td className="p-3">{row.netSales?.toLocaleString()}</td>
                         <td className="p-3">{Math.round(row.unitCost || 0).toLocaleString()}</td>
                         <td className="p-3 text-red-600">{Math.round(row.cogs).toLocaleString()}</td>
                         <td className={`p-3 font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.round(row.profit).toLocaleString()}</td>
                         <td className="p-3" dir="ltr">{row.marg.toFixed(1)}%</td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
            </div>
        </>
      )}
    </div>
  );
}
