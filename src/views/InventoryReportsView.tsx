import React, { useState, useEffect } from "react";
import {
  Archive,
  Scale,
  Truck,
  PackageSearch,
  Trash2,
  Calendar,
  ChevronDown,
  RotateCcw,
  BarChart2,
  PieChart as PieIcon,
  Activity,
  Layers
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

export default function InventoryReportsView() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ret_purchases");
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
    fetch(`/api/reports/inventory?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [period]);

  const tabs = [
    { id: "ret_purchases", label: "تحلیل برگشت از خرید (تامین)", icon: <RotateCcw size={16} /> },
    { id: "supplier", label: "رتبه‌بندی تامین", icon: <Truck size={16} /> },
    { id: "cardex", label: "کاردکس موجودی", icon: <Archive size={16} /> },
    { id: "velocity", label: "گردش کالا", icon: <PackageSearch size={16} /> },
  ];

  const formatRial = (v: number) => Number(v || 0).toLocaleString() + " ریال";
  const formatQty = (v: number) => Number(v || 0).toLocaleString();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  return (
    <div className="p-6 md:p-8 h-full flex flex-col overflow-auto print:overflow-visible print:h-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-emerald-500 pr-3">
            عملیات انبار و تامین
          </h1>
          <p className="text-slate-500 text-sm">
            موجودی فعلی در دوره:{" "}
            <strong className="text-slate-700">
               {data ? data.currentStock?.toLocaleString() : "..."} واحد
            </strong>
          </p>
        </div>
         <div className="flex items-center gap-4">
          <ExportPrintButtons moduleName="purchases" period={period} fileName="Inventory_Report" />
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

      <div className="flex bg-white rounded-lg p-1 border border-slate-200 mb-6 shrink-0 w-max flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
              activeTab === tab.id
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full min-h-[400px]">
        {/* === RETURNS PURCHASE TAB === */}
        {activeTab === "ret_purchases" && data && (
          <div className="flex flex-col gap-10">
            <div>
               <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                  <RotateCcw className="text-amber-500" />
                  برگشت از خرید - تحلیل ریالی و تعدادی 
               </h3>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="h-64 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">مبالغ برگشتی گروه اصلی (BarChart)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.retL1?.slice(0,5)} margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <RechartsTooltip formatter={(v:number)=>formatRial(v)}/>
                           <Bar dataKey="amt" name="ارزش ریالی مرجوعی" fill="#ef4444" radius={[4,4,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  
                  <div className="h-64 border rounded-xl p-4 bg-slate-50">
                     <h4 className="text-center font-bold text-sm text-slate-600 mb-2">تعداد برگشتی زیرگروه‌ها (L2)</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.retL2?.slice(0,5)} margin={{top:10, left:20, right:20, bottom:0}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <RechartsTooltip formatter={(v:number)=>formatQty(v)}/>
                           <Line type="monotone" dataKey="qty" stroke="#f59e0b" strokeWidth={3} dot={{r:4}} name="تعداد مرجوعی" />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <h4 className="font-bold text-slate-700 mb-4 bg-amber-50 border border-amber-100 p-3 rounded-lg">کالاهایی با بیشترین مرجوعی به تامین‌کنندگان</h4>
               <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-amber-100/50 text-amber-900 border-b border-amber-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ردیف</th>
                        <th className="py-3 px-4 font-semibold">نام کالا (ردیف تامین)</th>
                        <th className="py-3 px-4 font-semibold">تعداد مرجوعی (واحد)</th>
                        <th className="py-3 px-4 font-semibold">ارزش ریالی برگشتی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 bg-white">
                      {data.retProducts?.slice(0, 15).map((item: any, i:number) => {
                         return (
                        <tr key={`retpurchprod-${item.name}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold">{i+1}</td>
                          <td className="py-3 px-4 font-semibold">{item.name}</td>
                          <td className="py-3 px-4 font-mono text-rose-600">{formatQty(item.qty)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-700">{formatRial(item.amt)}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* Existing empty/help states for missing tabs */}
        {activeTab !== "ret_purchases" && data && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
            <Archive size={40} className="mb-4 text-slate-300" />
            <p className="mb-2">داده‌های زیرسیستم مورد نظر یافت نشد.</p>
            <p className="text-sm">لطفا فایل‌های مرتبط با این گزارش (خرید، انبارگردانی) را بارگذاری نمایید.</p>
          </div>
        )}

        {!data && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center flex-1 min-h-[300px]">
            <Archive size={48} className="mb-4 text-slate-300 animate-pulse" />
            <p>در حال تنظیم و محاسبه گزارشات انبار...</p>
          </div>
        )}
      </div>
    </div>
  );
}
