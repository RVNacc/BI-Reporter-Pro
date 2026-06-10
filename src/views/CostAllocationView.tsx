import React, { useState, useEffect } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  Settings,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

export default function CostAllocationView() {
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [viewLevel, setViewLevel] = useState<'level_1' | 'level_2'>('level_2');
  const [isSyncing, setIsSyncing] = useState(false);

  const [newName, setNewName] = useState("");
  const [newBase, setNewBase] = useState("sales_value");
  const [newCost, setNewCost] = useState("");

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [editingTargetCategories, setEditingTargetCategories] = useState<string[]>([]);

  const fetchCenters = async () => {
    try {
      const res = await fetch("/api/cost-centers");
      if (res.ok) setCostCenters(await res.json());
    } catch (e) {}
  };

  const fetchReport = async () => {
    try {
      const res = await fetch("/api/reports/cost-allocation");
      if (res.ok) setReportData(await res.json());
    } catch (e) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/product-categories");
      if (res.ok) setAvailableCategories(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchCenters();
    fetchReport();
    fetchCategories();
  }, []);

  const handleAddCenter = async () => {
    if (!newName || !newCost) return;
    try {
      await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          allocation_base: newBase,
          total_cost: parseFloat(newCost),
          target_categories: selectedCategories.join(","),
        }),
      });
      setNewName("");
      setNewCost("");
      setSelectedCategories([]);
      setCatDropdownOpen(false);
      fetchCenters();
      fetchReport(); // Refresh report
    } catch (e) {}
  };

  const handleSyncCosts = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cost-centers/auto-sync", {
        method: "POST",
      });
      if (res.ok) {
        alert(
          "مراکز فعالیت و هزینه‌ها از فایل‌های مالی استخراج و بروزرسانی شدند.",
        );
        fetchCenters();
        fetchReport();
      } else {
        alert(
          "خطا در همگام‌سازی هزینه‌ها. مطمئن شوید فایل هزینه‌ها با فیلد «مرکز فعالیت» بارگذاری شده باشد.",
        );
      }
    } catch (e) {
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCenter = async (id: number) => {
    try {
      await fetch(`/api/cost-centers/${id}`, { method: "DELETE" });
      fetchCenters();
      fetchReport();
    } catch (e) {}
  };

  const handleUpdateBase = async (id: number, newBase: string) => {
    try {
      await fetch(`/api/cost-centers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocation_base: newBase }),
      });
      fetchCenters();
      fetchReport();
    } catch (e) {}
  };

  const baseLabels: any = {
    sales_value: "مبلغ فروش",
    sales_qty: "تعداد فروش",
    sales_invoice_count: "تعداد فاکتور فروش",
    purchase_value: "مبلغ خرید",
    purchase_qty: "تعداد خرید",
    purchase_invoice_count: "تعداد فاکتور خرید",
    sales_price: "نرخ فروش",
    purchase_price: "نرخ خرید",
    time_spent: "زمان صرف شده (ساعت)",
  };

  return (
    <div className="p-8 h-full flex flex-col justify-start overflow-auto print:overflow-visible print:h-auto print:p-2 print:block">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">
            بهابای تمام شده مبتنی بر فعالیت (ABC)
          </h1>
          <p className="text-slate-500 text-sm">
            تسهیم هزینه‌های ثابت و متغیر بر روی رده‌های کالایی جهت استخراج حاشیه
            سود واقعی
          </p>
        </div>
          <ExportPrintButtons moduleName="sales" period="" fileName="Cost_Allocation" />
      </div>

      {/* Configurations */}
      <div className="print:hidden bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Settings size={20} className="text-slate-400" />
            تنظیمات مراکز فعالیت و مبانی تسهیم
          </h2>
          <button
            onClick={handleSyncCosts}
            disabled={isSyncing}
            className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-100 transition"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            استخراج خودکار از فایل مالی
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input
            type="text"
            placeholder="نام مرکز فعالیت (مثل: انبار)"
            className="border rounded-lg p-2.5 flex-1 min-w-[200px] text-sm outline-none focus:ring-2 focus:ring-amber-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="number"
            placeholder="هزینه کل (ریال)"
            className="border rounded-lg p-2.5 flex-1 min-w-[200px] text-sm outline-none focus:ring-2 focus:ring-amber-500"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
          />
          <select
            className="border rounded-lg p-2.5 flex-1 min-w-[200px] text-sm outline-none focus:ring-2 focus:ring-amber-500"
            value={newBase}
            onChange={(e) => setNewBase(e.target.value)}
          >
            <option value="sales_value">مبالغ فروش</option>
            <option value="sales_qty">تعداد واحدهای فروخته شده</option>
            <option value="sales_invoice_count">تعداد فاکتورهای فروش</option>
            <option value="purchase_value">مبالغ خرید</option>
            <option value="purchase_qty">تعداد واحدهای خریداری شده</option>
            <option value="purchase_invoice_count">تعداد فاکتورهای خرید</option>
            <option value="sales_price">نرخ فروش</option>
            <option value="purchase_price">نرخ خرید</option>
            <option value="time_spent">زمان / ساعت</option>
            <option value="sales_and_purchase_qty">جمع تعداد واحدهای خرید و فروش</option>
            <option value="sales_and_purchase_value">جمع مبلغی خرید و فروش</option>
            <option value="sales_and_purchase_hours">جمع ساعت های فاکتور های خرید و فروش</option>
            <option value="sales_and_purchase_invoice_count">جمع تعداد فاکتور های خرید و فروش</option>
            <option value="sales_and_purchase_price">جمع نرخ های خرید و فروش</option>
            <option value="sales_and_purchase_and_returns_price">جمع نرخ های خرید، فروش و برگشتی‌ها</option>
            <option value="sales_and_purchase_and_returns_invoice_count">جمع تعداد فاکتور های خرید، فروش و برگشتی‌ها</option>
            <option value="sales_and_purchase_and_returns_qty">جمع تعداد واحد های خرید، فروش و برگشتی‌ها</option>
            <option value="sales_and_purchase_and_returns_hours">جمع ساعات خرید، فروش و برگشتی‌ها</option>
          </select>
          <div className="relative flex-1 min-w-[250px]">
            <div
              className="border rounded-lg p-2.5 text-sm bg-white cursor-pointer flex justify-between items-center"
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            >
              <span className="text-slate-500 truncate max-w-[200px]">
                {selectedCategories.length === 0
                  ? "همه رده‌ها (پيش‌فرض)"
                  : selectedCategories.join("، ")}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
            {catDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-auto">
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b sticky top-0 bg-white">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0}
                    onChange={() => setSelectedCategories([])}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    همه رده‌ها (اعمال به کل)
                  </span>
                </label>
                {availableCategories.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">
                    ردیف کالایی یافت نشد. ابتدا فایل محصولات را بارگذاری کنید.
                  </div>
                ) : (
                  availableCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedCategories([...selectedCategories, cat]);
                          else
                            setSelectedCategories(
                              selectedCategories.filter((c) => c !== cat),
                            );
                        }}
                        className="accent-amber-500 rounded"
                      />
                      <span className="text-sm text-slate-600">{cat}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleAddCenter}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-6 py-2.5 flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} /> افزودن
          </button>
        </div>

        {costCenters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {costCenters.map((cc) => {
              const visualData = reportData?.costCenterVisuals?.find(
                (v: any) => v.id === cc.id,
              );
              const chartData = visualData?.chartData || [];
              const COLORS = [
                "#f59e0b",
                "#3b82f6",
                "#10b981",
                "#ef4444",
                "#8b5cf6",
              ];

              return (
                <div
                  key={cc.id}
                  className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        {cc.name}
                      </h3>
                      <div className="text-sm font-mono text-slate-500 mt-1">
                        {Number(cc.total_cost).toLocaleString()} ریال
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCenter(cc.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-4">
                    <div className="mt-2 h-32 flex items-center justify-center pt-4">
                      {chartData.length > 0 ? (
                        <div className="w-full flex h-full">
                          <div className="flex-1 max-w-[120px] flex items-center">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full transform -rotate-90"
                            >
                              {chartData.map(
                                (d: any, i: number, arr: any[]) => {
                                  const total = arr.reduce(
                                    (acc, curr) => acc + curr.value,
                                    0,
                                  );
                                  const prevTotal = arr
                                    .slice(0, i)
                                    .reduce((acc, curr) => acc + curr.value, 0);
                                  if (d.value === total && total > 0) {
                                    return (
                                        <circle
                                            key={d.name}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill={COLORS[i % COLORS.length]}
                                        />
                                    );
                                  }

                                  const startAngle = (prevTotal / total) * 360;
                                  const endAngle =
                                    ((prevTotal + d.value) / total) * 360;

                                  // Adjust coordinates so arc works well (to avoid precision issues with perfectly 360)
                                  const largeArcFlag =
                                    endAngle - startAngle <= 180 ? 0 : 1;
                                  const x1 =
                                    50 +
                                    40 * Math.cos((Math.PI * startAngle) / 180);
                                  const y1 =
                                    50 +
                                    40 * Math.sin((Math.PI * startAngle) / 180);
                                  const x2 =
                                    50 +
                                    40 * Math.cos((Math.PI * endAngle) / 180);
                                  const y2 =
                                    50 +
                                    40 * Math.sin((Math.PI * endAngle) / 180);

                                  const pathData = [
                                    `M 50 50`,
                                    `L ${x1} ${y1}`,
                                    `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                    `Z`,
                                  ].join(" ");


                                  return (
                                    <path
                                      key={d.name}
                                      d={pathData}
                                      fill={COLORS[i % COLORS.length]}
                                    />
                                  );
                                },
                              )}
                            </svg>
                          </div>
                          <div className="flex-1 flex flex-col justify-center overflow-auto px-2 gap-1 custom-scrollbar">
                            {chartData.map((d: any, i: number) => (
                              <div
                                key={d.name}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <div
                                    className="w-2 h-2 rounded-sm shrink-0"
                                    style={{
                                      backgroundColor:
                                        COLORS[i % COLORS.length],
                                    }}
                                  ></div>
                                  <span
                                    className="truncate text-slate-600"
                                    title={d.name}
                                  >
                                    {d.name}
                                  </span>
                                </div>
                                <span className="font-mono text-slate-500 shrink-0 pr-2">
                                  {((d.value / cc.total_cost) * 100).toFixed(0)}
                                  %
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs text-center">
                          هیچ جذبی صورت نگرفته است.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Traditional Table View */}
        {costCenters.length > 0 && (
          <div className="mt-8 border rounded-xl overflow-visible print:block text-sm bg-white">
            <h3 className="p-4 bg-slate-50 border-b font-bold text-slate-700">
              جدول لیست مراکز هزینه و تخصیص
            </h3>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-700 border-b">
                <tr>
                  <th className="p-3 font-semibold">تاسیس شده / نام مرکز</th>
                  <th className="p-3 font-semibold">تخصیص یافته (ریال)</th>
                  <th className="p-3 font-semibold">نسبت به کل هزینه</th>
                  <th className="p-3 font-semibold">مبنای تسهیم داینامیک</th>
                  <th className="p-3 font-semibold">سطح گروه تسهیم</th>
                  <th className="p-3 font-semibold">رده‌های هدف (سهم‌دهنده)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costCenters.map((cc) => {
                  const sumGlobalCost = costCenters.reduce((acc, curr) => acc + curr.total_cost, 0);
                  const shareOfTotal = sumGlobalCost ? ((cc.total_cost / sumGlobalCost) * 100).toFixed(1) : "0.0";
                  
                  return (
                    <tr key={cc.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">
                        {cc.name}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {Number(cc.total_cost).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {shareOfTotal}%
                      </td>
                      <td className="p-3">
                        <select
                          value={cc.allocation_base}
                          onChange={(e) => handleUpdateBase(cc.id, e.target.value)}
                          className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 max-w-[200px]"
                        >
                          <option value="sales_value">مبالغ فروش</option>
                          <option value="sales_qty">تعداد واحدهای فروخته شده</option>
                          <option value="sales_invoice_count">تعداد فاکتورهای فروش</option>
                          <option value="purchase_value">مبالغ خرید</option>
                          <option value="purchase_qty">تعداد واحدهای خریداری شده</option>
                          <option value="purchase_invoice_count">تعداد فاکتورهای خرید</option>
                          <option value="sales_price">نرخ فروش</option>
                          <option value="purchase_price">نرخ خرید</option>
                          <option value="time_spent">زمان / ساعت</option>
                          <option value="sales_and_purchase_qty">جمع تعداد واحدهای خرید و فروش</option>
                          <option value="sales_and_purchase_value">جمع مبلغی خرید و فروش</option>
                          <option value="sales_and_purchase_hours">جمع ساعت های فاکتور های خرید و فروش</option>
                          <option value="sales_and_purchase_invoice_count">جمع تعداد فاکتور های خرید و فروش</option>
                          <option value="sales_and_purchase_price">جمع نرخ های خرید و فروش</option>
                          <option value="sales_and_purchase_and_returns_price">جمع نرخ های خرید، فروش و برگشتی‌ها</option>
                          <option value="sales_and_purchase_and_returns_invoice_count">جمع تعداد فاکتور های خرید، فروش و برگشتی‌ها</option>
                          <option value="sales_and_purchase_and_returns_qty">جمع تعداد واحد های خرید، فروش و برگشتی‌ها</option>
                          <option value="sales_and_purchase_and_returns_hours">جمع ساعات خرید، فروش و برگشتی‌ها</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={cc.allocation_level || 'level_1'}
                          onChange={(e) => {
                             fetch(`/api/cost-centers/${cc.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ allocation_level: e.target.value })
                             }).then(() => {
                                fetchCenters();
                                fetchReport();
                             });
                          }}
                          className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="level_1">سطح ۱ (گروه اصلی)</option>
                          <option value="level_2">سطح ۲ (زیرگروه)</option>
                        </select>
                      </td>
                      <td className="p-3 relative">
                        {editingTargetId === cc.id ? (
                           <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 bg-white border border-slate-300 rounded shadow-lg p-2 min-w-[250px]">
                              <div className="max-h-40 overflow-auto custom-scrollbar mb-2 border-b pb-2">
                                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                                  <input 
                                     type="checkbox" 
                                     checked={editingTargetCategories.length === 0}
                                     onChange={() => setEditingTargetCategories([])}
                                     className="accent-amber-500 rounded"
                                  />
                                  <span className="text-xs font-medium text-slate-700">همه رده‌ها (اعمال به کل)</span>
                                </label>
                                {availableCategories.filter(cat => (cc.allocation_level === 'level_2') ? cat.includes(' - ') : !cat.includes(' - ')).map(cat => (
                                  <label key={cat} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                                    <input 
                                       type="checkbox" 
                                       checked={editingTargetCategories.includes(cat)}
                                       onChange={(e) => {
                                          if(e.target.checked) setEditingTargetCategories([...editingTargetCategories, cat]);
                                          else setEditingTargetCategories(editingTargetCategories.filter(c => c !== cat));
                                       }}
                                       className="accent-amber-500 rounded"
                                    />
                                    <span className="text-xs text-slate-600 truncate">{cat}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => {
                                    fetch(`/api/cost-centers/${cc.id}`, {
                                       method: "PUT",
                                       headers: { "Content-Type": "application/json" },
                                       body: JSON.stringify({ target_categories: editingTargetCategories.join(",") }),
                                    }).then(() => {
                                       setEditingTargetId(null);
                                       fetchCenters();
                                       fetchReport();
                                    });
                                 }} className="bg-amber-500 text-white text-xs px-3 py-1 rounded w-full">تایید</button>
                                 <button onClick={() => setEditingTargetId(null)} className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded w-full">تعویض</button>
                              </div>
                           </div>
                        ) : (
                           <button
                             onClick={() => {
                               setEditingTargetId(cc.id);
                               setEditingTargetCategories(cc.target_categories ? cc.target_categories.split(',') : []);
                             }}
                             className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-xs outline-none hover:border-slate-300 w-full text-right truncate max-w-[200px]"
                             title={cc.target_categories || "همه رده‌ها (یا خودکار)"}
                           >
                             {cc.target_categories || "همه رده‌ها (یا خودکار)"}
                           </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:bg-white print:border-none">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Calculator size={20} className="text-emerald-500" />
              ماتریس گزارش سهم جذب هزینه به تفکیک رده کالایی (داینامیک)
            </h3>
            {reportData && (
              <div className="flex bg-slate-200 rounded-lg p-1 print:hidden">
                <button
                  onClick={() => setViewLevel('level_1')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewLevel === 'level_1' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  سطح ۱ (گروه اصلی)
                </button>
                <button
                  onClick={() => setViewLevel('level_2')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewLevel === 'level_2' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  سطح ۲ (زیرگروه)
                </button>
              </div>
            )}
          </div>
          <button className="text-sm bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-slate-100 transition shadow-sm print:hidden">
            <TrendingUp size={16} className="text-blue-500" />
            خروجی اکسل ماتریس
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 pb-10 custom-scrollbar print:overflow-visible text-slate-900">
          {!reportData ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <RefreshCw className="animate-spin text-slate-300" size={32} />
              درحال محاسبه ماتریس هزینه‌ها براساس مبانی تعریف شده...
            </div>
          ) : (
            <table className="w-full text-right text-xs md:text-sm border-collapse">
              <thead className="bg-[#1e293b] text-slate-200 text-center sticky top-0 z-10 shadow-md">
                <tr>
                  <th
                    className="p-3 border-l border-slate-600 font-medium"
                    colSpan={2}
                  >
                    رده‌بندی محصول
                  </th>
                  <th
                    className="p-3 border-l border-slate-600 font-medium bg-emerald-900/50"
                    colSpan={2}
                  >
                    عملیات تامین (خرید)
                  </th>
                  <th
                    className="p-3 border-l border-slate-600 font-medium bg-blue-900/50"
                    colSpan={2}
                  >
                    عملیات صندوق (فروش)
                  </th>
                  <th className="p-3 font-medium bg-amber-900/50" colSpan={3}>
                    تسهیم هزینه‌ها براساس ABC
                  </th>
                </tr>
                <tr className="bg-slate-800 text-slate-300 font-normal">
                  <th className="p-2 border-l border-slate-600">
                    گروه اصلی (سطح ۱)
                  </th>
                  <th className="p-2 border-l border-slate-600">
                    زیرگروه (سطح ۲)
                  </th>
                  <th className="p-2 border-l border-slate-600 bg-emerald-900/30">
                    مبلغ خرید (ریال)
                  </th>
                  <th className="p-2 border-l border-slate-600 bg-emerald-900/30">
                    نسبت حجم
                  </th>
                  <th className="p-2 border-l border-slate-600 bg-blue-900/30">
                    مبلغ فروش (ریال)
                  </th>
                  <th className="p-2 border-l border-slate-600 bg-blue-900/30">
                    نسبت حجم
                  </th>
                  <th className="p-2 border-l border-slate-600 bg-amber-900/30 text-amber-200">
                    سهم هزینه (ریال)
                  </th>
                  <th className="p-2 border-l border-slate-600 bg-amber-900/30">
                    سهم از کل هزینه
                  </th>
                  <th className="p-2 bg-amber-900/30 text-red-300">
                    نسبت جذب (هزینه به فروش)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(viewLevel === 'level_1' ? reportData.dataLevel1 : reportData.dataLevel2).map((row: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 text-center transition-colors"
                  >
                    <td className="p-3 border-l border-slate-200 font-medium text-slate-800 text-right">
                      {row.level1}
                    </td>
                    <td className="p-3 border-l border-slate-200 text-slate-600 text-right">
                      {row.level2}
                    </td>
                    <td className="p-3 border-l border-slate-200 font-mono text-slate-600">
                      {Number(row.purchaseAmt).toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-slate-200 font-mono text-slate-500 bg-slate-50/50">
                      {row.purchaseRatio}%
                    </td>
                    <td className="p-3 border-l border-slate-200 font-mono text-slate-800">
                      {Number(row.salesAmt).toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-slate-200 font-mono text-slate-500 bg-slate-50/50">
                      {row.salesRatio}%
                    </td>
                    <td className="p-3 border-l border-slate-200 font-mono text-amber-700 font-medium bg-amber-50/30">
                      {Number(row.costAmt).toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-slate-200 font-mono text-slate-500 bg-amber-50/30">
                      {row.costRatio}%
                    </td>
                    <td className="p-3 font-mono text-red-600 font-bold bg-amber-50 whitespace-nowrap">
                      {row.costToSales}%{" "}
                      <span className="text-[10px] text-slate-400 mr-1 font-sans">
                        زیان‌دهی بالقوه مساوی با جذب بالا
                      </span>
                    </td>
                  </tr>
                ))}
                {(viewLevel === 'level_1' ? reportData.dataLevel1 : reportData.dataLevel2).length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      داده‌ای یافت نشد. لطفا فایل‌های فروش و تامین را وارد کنید.
                    </td>
                  </tr>
                )}
              </tbody>
              {reportData.totals && (viewLevel === 'level_1' ? reportData.dataLevel1 : reportData.dataLevel2).length > 0 && (
                <tfoot className="bg-slate-800 text-white font-medium text-center border-t border-slate-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <tr>
                    <td
                      colSpan={2}
                      className="p-3 border-l border-slate-700 text-right pr-6"
                    >
                      جمع ماتریس عملیات
                    </td>
                    <td className="p-4 border-l border-slate-700 font-mono text-emerald-300">
                      {Number(reportData.totals.purchaseAmt).toLocaleString()}
                    </td>
                    <td className="p-4 border-l border-slate-700 font-mono text-slate-400">
                      100.00%
                    </td>
                    <td className="p-4 border-l border-slate-700 font-mono text-blue-300">
                      {Number(reportData.totals.salesAmt).toLocaleString()}
                    </td>
                    <td className="p-4 border-l border-slate-700 font-mono text-slate-400">
                      100.00%
                    </td>
                    <td className="p-4 border-l border-slate-700 font-mono bg-slate-900 text-amber-400">
                      {Number(reportData.totals.costAmt).toLocaleString()}
                    </td>
                    <td className="p-4 border-l border-slate-700 font-mono bg-slate-900 text-slate-400">
                      100.00%
                    </td>
                    <td className="p-4 font-mono bg-slate-900 text-red-400">
                      {(
                        (reportData.totals.costAmt /
                          Math.max(1, reportData.totals.salesAmt)) *
                        100
                      ).toFixed(2)}
                      %
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
