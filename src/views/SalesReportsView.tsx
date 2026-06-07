import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Clock,
  Target,
  Layers,
  Calendar,
  ChevronDown,
  RotateCcw,
  Percent,
  BarChart2,
  PieChart as PieIcon,
  Activity,
  Box
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie
} from "recharts";

import HelpModal from "../components/HelpModal";
import ExportPrintButtons from "../components/ExportPrintButtons";

export default function SalesReportsView() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basket");
  const [period, setPeriod] = useState<string>("");

  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([
    { value: "", label: "همه دوره‌ها" },
  ]);

  useEffect(() => {
    fetch("/api/periods")
      .then((res) => res.json())
      .then(setPeriods)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`/api/reports/sales?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [period]);

  const tabs = [
    { id: "basket", label: "تحلیل سبد خرید (گروه‌ها)", icon: <ShoppingCart size={16} /> },
    { id: "profit", label: "حاشیه سود رده کالا", icon: <Percent size={16} /> },
    { id: "returns", label: "گزارشات برگشتی‌ها", icon: <RotateCcw size={16} /> },
    { id: "traffic", label: "ترافیک ساعتی", icon: <Clock size={16} /> },
  ];

  const formatRial = (v: number) => Number(v || 0).toLocaleString() + " ریال";
  const formatQty = (v: number) => Number(v || 0).toLocaleString();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  return (
    <div className="p-6 md:p-8 h-full flex flex-col overflow-auto print:overflow-visible print:h-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-blue-500 pr-3">
            تحلیل پیشرفته فروش و صندوق
          </h1>
          <p className="text-slate-500 text-sm flex gap-6">
            <span>
               فروش خالص دوره: {" "}
               <span className="font-bold text-slate-700">{data ? formatRial(data.totalVolume) : "..."}</span>
            </span>
            <span>
               تعداد خالص: {" "}
               <span className="font-bold text-slate-700">{data ? formatQty(data.totalQty) : "..."}</span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportPrintButtons moduleName="sales" period={period} fileName="Sales_Report" />
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-700 shadow-sm relative">
            <Calendar size={18} className="text-slate-400" />
            <select
              className="bg-transparent outline-none appearance-none pr-2 min-w-[120px] font-medium text-slate-700 cursor-pointer"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="text-slate-400 absolute left-3 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="flex bg-white rounded-lg p-1 border border-slate-200 mb-6 shrink-0 w-max flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
        
        {/* === BASKET TAB === */}
        {activeTab === "basket" && data && (
          <div className="flex flex-col gap-10">
            {/* L1 */}
            <div>
               <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-6 flex gap-2 items-center">
                  <Box className="text-blue-500"/>
                  تحلیل سبد خرید (گروه اصلی)
               </h3>
               
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                  <div className="h-72 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">روند ریالی گروه‌ها (Line)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.basketL1} margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <RechartsTooltip formatter={(v:number)=>formatRial(v)}/>
                           <Line type="monotone" dataKey="netAmt" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="h-72 border rounded-xl p-4 bg-slate-50 relative">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2 mt-2">سهم تعدادی هر گروه (Pie)</h4>
                     <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                           <Pie 
                             data={data.basketL1} 
                             dataKey="netQty" 
                             nameKey="name" 
                             cx="50%" 
                             cy="50%" 
                             outerRadius={70}
                             labelLine={true}
                             label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 20;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                  <text x={x} y={y} fill={COLORS[index % COLORS.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold" dir="ltr">
                                    {Number(value).toLocaleString()}
                                  </text>
                                );
                             }}
                           >
                              {data.basketL1.map((e:any, i:number) => <Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]}/>)}
                           </Pie>
                           <RechartsTooltip formatter={(v:number)=>formatQty(v)}/>
                           <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="py-3 px-4 font-semibold">گروه اصلی</th>
                        <th className="py-3 px-4 font-semibold">تعداد در سبد (آیتم)</th>
                        <th className="py-3 px-4 font-semibold">مقدار خالص</th>
                        <th className="py-3 px-4 font-semibold">مبلغ خالص (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 bg-white">
                      {data.basketL1?.map((item: any) => (
                        <tr key={`l1-${item.name}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold">{item.name}</td>
                          <td className="py-3 px-4 text-emerald-600 font-mono">{formatQty(item.basketCount)}</td>
                          <td className="py-3 px-4 font-mono">{formatQty(item.netQty)}</td>
                          <td className="py-3 px-4 font-mono">{formatRial(item.netAmt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* L2 */}
            <div>
               <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-6 mt-6 flex gap-2 items-center">
                  <Layers className="text-blue-500"/>
                  تحلیل سبد خرید (زیر گروه‌ها)
               </h3>

               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                  <div className="h-72 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">مقایسه فروش ریالی زیرگروه‌ها (Bar)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.basketL2.slice(0,10)} margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <RechartsTooltip formatter={(v:number)=>formatRial(v)}/>
                           <Bar dataKey="netAmt" fill="#10b981" radius={[4,4,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  
                  <div className="h-72 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">روند تعداد فروش زیرگروه‌ها (Line)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.basketL2.slice(0,10)} margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <RechartsTooltip formatter={(v:number)=>formatQty(v)}/>
                           <Line type="monotone" dataKey="netQty" stroke="#f59e0b" strokeWidth={3} dot={{r:4}} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="py-3 px-4 font-semibold">زیر گروه</th>
                        <th className="py-3 px-4 font-semibold">تعداد در سبد (آیتم)</th>
                        <th className="py-3 px-4 font-semibold">مقدار خالص</th>
                        <th className="py-3 px-4 font-semibold">مبلغ خالص (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 bg-white">
                      {data.basketL2?.slice(0, 15).map((item: any) => (
                        <tr key={`l2-${item.name}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold">{item.name}</td>
                          <td className="py-3 px-4 text-emerald-600 font-mono">{formatQty(item.basketCount)}</td>
                          <td className="py-3 px-4 font-mono">{formatQty(item.netQty)}</td>
                          <td className="py-3 px-4 font-mono">{formatRial(item.netAmt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* === PROFIT MARGIN TAB === */}
        {activeTab === "profit" && data && (
          <div className="flex flex-col gap-8">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Activity className="text-emerald-500" />
              حاشیه سود حاصل از فروش کالاها
            </h3>

            <div className="h-80 border rounded-xl p-4 bg-slate-50 mb-4">
              <h4 className="text-center font-bold text-sm text-slate-600 mb-2">مقایسه فروش و سود ناخالص گروه‌ها</h4>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.profitL1} margin={{top:10, left:20, right:20, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip formatter={(v:number)=>formatRial(v)}/>
                    <Legend />
                    <Bar dataKey="netAmt" name="فروش خالص" fill="#3b82f6" radius={[4,4,0,0]} />
                    <Bar dataKey="profit" name="سود ناخالص" fill="#10b981" radius={[4,4,0,0]} />
                 </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto border rounded-xl">
               <table className="w-full text-sm text-right">
                 <thead className="bg-slate-100 text-slate-700">
                   <tr>
                     <th className="py-3 px-4 font-semibold">رده کالا (گروه)</th>
                     <th className="py-3 px-4 font-semibold">مبلغ فروش خالص</th>
                     <th className="py-3 px-4 font-semibold">بهای تمام شده کالای فروش رفته</th>
                     <th className="py-3 px-4 font-semibold text-center mt-3">سود ناخالص (ریال)</th>
                     <th className="py-3 px-4 font-semibold text-center">حاشیه سود (%)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y text-slate-700 bg-white">
                   {data.profitL1?.map((item: any) => (
                     <tr key={`profit-${item.name}`} className="hover:bg-slate-50 transition-colors">
                       <td className="py-3 px-4 font-bold">{item.name}</td>
                       <td className="py-3 px-4 font-mono text-blue-700">{formatRial(item.netAmt)}</td>
                       <td className="py-3 px-4 font-mono text-rose-600">{formatRial(item.cogsForSales)}</td>
                       <td className="py-3 px-4 font-mono text-emerald-700 font-bold text-center bg-emerald-50/20">{formatRial(item.profit)}</td>
                       <td className="py-3 px-4 font-mono text-center">
                         <span className={`px-2 py-1 rounded inline-block min-w-16 ${item.marginPercent > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                           {item.marginPercent.toFixed(1)}%
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* === RETURNS TAB === */}
        {activeTab === "returns" && data && (
          <div className="flex flex-col gap-10">
            <div>
               <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                  <RotateCcw className="text-rose-500" />
                  برگشتی‌ها - تحلیل ریالی و تعدادی (گروه‌های پربرگشت)
               </h3>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="h-64 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">مبلغ برگشتی گروه اصلی (Bar)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topReturnedCatL1} margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <RechartsTooltip formatter={(v:number)=>formatRial(v)}/>
                           <Bar dataKey="returnAmt" name="مبلغ برگشتی" fill="#ef4444" radius={[4,4,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="h-64 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">مبلغ برگشتی زیرگروه (Bar)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topReturnedCatL2} layout="vertical" margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                           <XAxis type="number" hide />
                           <YAxis type="category" dataKey="name" width={100} tick={{fontSize:11}} />
                           <RechartsTooltip formatter={(v:number)=>formatRial(v)}/>
                           <Bar dataKey="returnAmt" name="مبلغ برگشتی" fill="#f97316" radius={[0,4,4,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <h4 className="font-bold text-slate-700 mb-4 bg-rose-50 border border-rose-100 p-3 rounded-lg">کالاهایی با بیشترین برگشتی از فروش</h4>
               <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-rose-50 text-rose-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ردیف</th>
                        <th className="py-3 px-4 font-semibold">نام کالا</th>
                        <th className="py-3 px-4 font-semibold">تعداد برگشتی</th>
                        <th className="py-3 px-4 font-semibold">مبلغ برگشتی (ریال)</th>
                        <th className="py-3 px-4 font-semibold text-center">درصد از کل برگشتی‌ها</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 bg-white">
                      {data.topReturnedProducts?.map((item: any, i:number) => {
                         const totalReturnAmt = data.topReturnedProducts.reduce((acc:number, ro:any)=>acc+ro.returnAmt,0);
                         return (
                        <tr key={`retprod-${item.name}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold">{i+1}</td>
                          <td className="py-3 px-4 font-semibold">{item.name}</td>
                          <td className="py-3 px-4 font-mono text-rose-600">{formatQty(item.returnQty)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-700">{formatRial(item.returnAmt)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-orange-600 text-center">
                             {totalReturnAmt > 0 ? ((item.returnAmt / totalReturnAmt) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* === TRAFFIC TAB === */}
        {activeTab === "traffic" && data && (
          <div className="h-full flex flex-col">
            <h3 className="font-semibold text-slate-700 mb-6">
              ترافیک ساعتی فروشگاه (براساس تراکنش‌های صندوق)
            </h3>
            {data.trafficArr && data.trafficArr.length > 0 ? (
              <div className="flex-1 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.trafficArr}
                    margin={{ top: 10, right: 10, bottom: 20, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false}
                      label={{ value: "ساعت (HH)", position: "insideBottom", offset: -10, fill: "#64748b" }}
                    />
                    <YAxis tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip formatter={(val: number) => val + " تراکنش"} labelFormatter={(val) => "ساعت " + val} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="تعداد">
                      {data.trafficArr.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill="#3b82f6" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                داده‌ای برای این دوره یافت نشد.
              </div>
            )}
          </div>
        )}

        {!data && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center flex-1 min-h-[300px]">
            <ShoppingCart size={48} className="mb-4 text-slate-300 animate-pulse" />
            <p>در حال پردازش و استخراج گزارشات پیشرفته...</p>
          </div>
        )}
      </div>
    </div>
  );
}
