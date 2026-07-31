import React, { useState, useEffect } from 'react';
import ExportPrintButtons from '../components/ExportPrintButtons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DiscountAnalysisView() {
  const [data, setData] = useState<any>({ products: [], categories: [], freightProducts: [], freightCategories: [] });
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'discounts' | 'freight'>('discounts');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discounts-analysis?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Discount Charts
  const productChartData = (data.products || []).map((p: any) => {
    const totalDiscount = p.discountOverall + p.discountLevel1 + p.discountLevel2;
    const netSales = p.grossSales - totalDiscount;
    return {
      name: p.productName,
      'تخفیف کلی': p.discountOverall,
      'تخفیف سطح ۱': p.discountLevel1,
      'تخفیف سطح ۲': p.discountLevel2,
      'فروش ناخالص': p.grossSales,
      'فروش خالص': netSales,
      'درصد تخفیف': p.grossSales > 0 ? ((totalDiscount / p.grossSales) * 100).toFixed(2) : 0
    };
  }).sort((a: any, b: any) => b['فروش ناخالص'] - a['فروش ناخالص']).slice(0, 10);

  const categoryChartData = (data.categories || []).map((c: any) => {
    return {
      name: c.category,
      value: c.totalDiscount
    };
  });

  // Freight Charts
  const freightProductChartData = (data.freightProducts || []).map((p: any) => {
    return {
      name: p.productName,
      'کرایه حمل': p.freightCost,
      'ارزش خرید': p.grossPurchases,
      'درصد کرایه': p.grossPurchases > 0 ? ((p.freightCost / p.grossPurchases) * 100).toFixed(2) : 0
    };
  }).sort((a: any, b: any) => b['کرایه حمل'] - a['کرایه حمل']).slice(0, 10);

  const freightCategoryChartData = (data.freightCategories || []).map((c: any) => {
    return {
      name: c.category,
      value: c.totalFreight
    };
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">تحلیل حمل و تخفیفات</h1>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="دوره (مثلا 1403/05)" 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-md">بروزرسانی</button>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-2 space-x-reverse border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('discounts')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'discounts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          تحلیل تخفیفات (فروش)
        </button>
        <button 
          onClick={() => setActiveTab('freight')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'freight' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          تحلیل کرایه حمل (خرید)
        </button>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <div className="flex flex-col gap-6">
          
          {activeTab === 'discounts' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-4">۱۰ کالای برتر در تخفیفات</h2>
                  <div className="h-96 w-full" dir="ltr">
                    <ResponsiveContainer>
                      <BarChart data={productChartData} margin={{ top: 20, right: 30, left: 40, bottom: 140 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={160} 
                          tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} 
                          tick={{fontSize: 11, dy: 10, dx: -10, fill: "#64748b", direction: "ltr"}} 
                          interval={0} 
                        />
                        <YAxis 
                          width={80}
                          tick={{ fontSize: 12, direction: 'ltr' }}
                          tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: "compact", maximumFractionDigits: 1 }).format(value)}
                        />
                        <Tooltip formatter={(value: any) => new Intl.NumberFormat('fa-IR').format(value)} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="تخفیف کلی" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="تخفیف سطح ۱" stackId="a" fill="#10b981" />
                        <Bar dataKey="تخفیف سطح ۲" stackId="a" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-4">سهم تخفیفات به تفکیک گروه</h2>
                  <div className="h-80 w-full" dir="ltr">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {categoryChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              
              
              <div className="flex justify-between items-center mb-4 mt-6">
                <h3 className="text-lg font-semibold text-slate-800">جزئیات تخفیفات</h3>
                <ExportPrintButtons data={data.products || []} fileName="تخفیفات_کالا" />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                 <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                       <tr>
                         <th className="p-3">نام کالا</th>
                         <th className="p-3">تعداد فروش</th>
                         <th className="p-3">فروش ناخالص</th>
                         <th className="p-3">تخفیف کلی</th>
                         <th className="p-3">تخفیف سطح ۱</th>
                         <th className="p-3">تخفیف سطح ۲</th>
                         <th className="p-3">فروش خالص</th>
                         <th className="p-3">نرخ خالص (واحد)</th>
                         <th className="p-3">% تخفیف</th>
                       </tr>
                    </thead>
                    <tbody>
                       {(data.products || []).map((p: any, i: number) => {
                         const totalDiscount = p.discountOverall + p.discountLevel1 + p.discountLevel2;
                         const netSales = p.grossSales - totalDiscount;
                         const perc = p.grossSales > 0 ? ((totalDiscount / p.grossSales) * 100).toFixed(1) : 0;
                         return (
                           <tr key={i} className="border-b hover:bg-slate-50">
                             <td className="p-3">{p.productName}</td>
                             <td className="p-3">{p.qty.toLocaleString()}</td>
                             <td className="p-3">{p.grossSales.toLocaleString()}</td>
                             <td className="p-3">{p.discountOverall.toLocaleString()}</td>
                             <td className="p-3">{p.discountLevel1.toLocaleString()}</td>
                             <td className="p-3">{p.discountLevel2.toLocaleString()}</td>
                             <td className="p-3 font-semibold">{netSales.toLocaleString()}</td>
                             <td className="p-3 text-blue-600 font-medium">{p.qty > 0 ? Math.round(netSales / p.qty).toLocaleString() : 0}</td>
                             <td className="p-3" dir="ltr">{perc}%</td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
            </>
          )}

          {activeTab === 'freight' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-4">۱۰ کالای برتر در کرایه حمل</h2>
                  <div className="h-96 w-full" dir="ltr">
                    <ResponsiveContainer>
                      <BarChart data={freightProductChartData} margin={{ top: 20, right: 30, left: 40, bottom: 140 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={160} 
                          tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} 
                          tick={{fontSize: 11, dy: 10, dx: -10, fill: "#64748b", direction: "ltr"}} 
                          interval={0} 
                        />
                        <YAxis 
                          width={80}
                          tick={{ fontSize: 12, direction: 'ltr' }}
                          tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: "compact", maximumFractionDigits: 1 }).format(value)}
                        />
                        <Tooltip formatter={(value: any) => new Intl.NumberFormat('fa-IR').format(value)} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="کرایه حمل" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-4">سهم کرایه حمل به تفکیک گروه</h2>
                  <div className="h-80 w-full" dir="ltr">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={freightCategoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {freightCategoryChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4 mt-6">
                <h3 className="text-lg font-semibold text-slate-800">جزئیات کرایه حمل</h3>
                <ExportPrintButtons data={data.freightProducts || []} fileName="کرایه_حمل_کالا" />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                 <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                       <tr>
                         <th className="p-3">نام کالا</th>
                         <th className="p-3">تعداد خرید</th>
                         <th className="p-3">ارزش ناخالص خرید</th>
                         <th className="p-3">کرایه حمل</th>
                         <th className="p-3">سهم کرایه در واحد</th>
                         <th className="p-3">% کرایه از خرید</th>
                       </tr>
                    </thead>
                    <tbody>
                       {(data.freightProducts || []).map((p: any, i: number) => {
                         const perc = p.grossPurchases > 0 ? ((p.freightCost / p.grossPurchases) * 100).toFixed(1) : 0;
                         return (
                           <tr key={i} className="border-b hover:bg-slate-50">
                             <td className="p-3">{p.productName}</td>
                             <td className="p-3">{p.qty.toLocaleString()}</td>
                             <td className="p-3">{p.grossPurchases.toLocaleString()}</td>
                             <td className="p-3 font-semibold text-red-600">{p.freightCost.toLocaleString()}</td>
                             <td className="p-3 font-medium">{p.qty > 0 ? Math.round(p.freightCost / p.qty).toLocaleString() : 0}</td>
                             <td className="p-3" dir="ltr">{perc}%</td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
