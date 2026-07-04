import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Cell,
  LineChart,
  AreaChart,
  Area
} from "recharts";
import {
  Filter,
  BarChart3,
  TrendingUp,
  RotateCcw,
  Truck,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Search,
  Bookmark,
  Target,
  BrainCircuit,
  LineChart as LineChartIcon
} from "lucide-react";
import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

export default function AdvancedManagementView() {
  const [activeTab, setActiveTab] = useState("bi");
  const [period, setPeriod] = useState<string>("");
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  
  const [data, setData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [breakevenData, setBreakevenData] = useState<any>(null);
  const [costTrendData, setCostTrendData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  
  // Search and filters for stock reconciliation table
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/periods")
      .then((res) => res.json())
      .then((data) => setAvailablePeriods(data || []))
      .catch(console.error);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [biRes, forecastRes, breakevenRes, costRes] = await Promise.all([
            fetch(`/api/reports/advanced-bi?period=${period}`),
            fetch(`/api/reports/forecast?period=${period}`),
            fetch(`/api/reports/breakeven?period=${period}`),
            fetch(`/api/reports/cost-trends?period=${period}`)
        ]);

        if (biRes.ok) setData(await biRes.json());
        if (forecastRes.ok) setForecastData(await forecastRes.json());
        if (breakevenRes.ok) setBreakevenData(await breakevenRes.json());
        if (costRes.ok) setCostTrendData(await costRes.json());
    } catch (err) {
        console.error("Error fetching advanced reports:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading || !data) {
    return (
      <div id="loading-spinner" className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">در حال پردازش آمار و الگوهای پیشرفته...</p>
      </div>
    );
  }
  
  if (data.error) {
      return <div className="p-10 text-center text-red-500">{data.error}</div>;
  }

  // Filter reconciliation list based on search term & status
  const filteredRepo = (data.reconciliationList || []).filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "discrepancy") return matchesSearch && item.expectedQty < 0;
    if (statusFilter === "stale") return matchesSearch && item.salesQty === 0 && item.expectedQty > 0;
    if (statusFilter === "reorder") return matchesSearch && item.status.includes("شارژ");
    return matchesSearch;
  });

  // Calculate some simple KPIs
  const totalSuppliers = data.supplierArr?.length || 0;
  
  const worstSupplier = [...(data.supplierArr || [])]
    .filter((s: any) => s.purchaseAmt > 0)
    .sort((a: any, b: any) => b.returnRate - a.returnRate)[0];

  const highestSalesDay = [...(data.weekdayArr || [])]
    .sort((a: any, b: any) => b.salesAmt - a.salesAmt)[0];

  const discrepancyCount = (data.reconciliationList || [])
    .filter((item: any) => item.expectedQty < 0).length;

  const handleExportCSV = () => {
    // Basic CSV download helper
    const headers = "کد کالا,نام کالا,گروه اصلی,موجودی اول دوره,خرید خالص,فروش خالص,موجودی پایان دوره تخمینی,وضعیت تطبیق\n";
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers 
      + filteredRepo.map((e: any) => `${e.code},${e.name},${e.category},${e.openingQty},${e.purchQty},${e.salesQty},${e.expectedQty},${e.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `گزارش_مغایرت_انبار_${period || "کل"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) return <div className="p-6 flex justify-center items-center h-full text-slate-500 font-medium">در حال بارگذاری...</div>;
  const isEmptyData = data && 
    (!data.reconciliationList || data.reconciliationList.length === 0) && 
    (!data.weekdayArr || data.weekdayArr.every((d: any) => d.txCount === 0));

  if (isEmptyData) {
    return (
      <div className="p-6 space-y-6">
        <div id="filter-wrapper" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <AdvancedPeriodFilter
            value={period}
            onChange={setPeriod}
            availableYears={availablePeriods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]}
          />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[450px] border border-slate-200 rounded-xl bg-white shadow-sm p-10">
          <AlertTriangle size={64} className="text-slate-200 mb-6" />
          <p className="text-lg text-slate-500 font-bold mb-2">داده‌ای یافت نشد.</p>
          <p className="text-slate-400 font-medium">هیچ اطلاعات عملیاتی یا تراکنشی برای تولید گزارشات هوش تجاری در این فیلتر یا برنامه وجود ندارد. لطفاً ابتدا اسناد مورد نیاز را آپلود کنید.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="advanced-management-view" className="p-6 space-y-6">
      {/* Header Panel */}
      <div id="header-panel" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            هوش تجاری و گزارش‌های پیشرفته (BI)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            تحلیل الگوهای رفتاری صندوق، مغایرت‌گیری انبار، پیش‌بینی هوشمند و نقطه‌سربه‌سر
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportPrintButtons onExport={handleExportCSV} />
        </div>
      </div>

      {/* Period Selector Panel */}
      <div id="filter-wrapper" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <AdvancedPeriodFilter
          value={period}
          onChange={setPeriod}
          availableYears={availablePeriods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]}
        />
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pt-2">
          <button 
             onClick={() => setActiveTab('bi')} 
             className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'bi' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
             <BarChart3 size={18} /> داشبورد BI و انبار
          </button>
          <button 
             onClick={() => setActiveTab('forecast')} 
             className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'forecast' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
             <BrainCircuit size={18} /> پیش‌بینی و هشدار هوشمند
          </button>
          <button 
             onClick={() => setActiveTab('breakeven')} 
             className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'breakeven' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
             <Target size={18} /> تحلیل نقطه سر‌به‌سر
          </button>
          <button 
             onClick={() => setActiveTab('costtrends')} 
             className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === 'costtrends' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
             <LineChartIcon size={18} /> روند تغییرات بهای تمام شده
          </button>
        </div>
      </div>

      {activeTab === 'bi' && (
      <>
      {/* KPI Cards Bento Box */}
      <div id="kpi-grid" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Suppliers Count */}
        <div id="kpi-suppliers" className="bg-gradient-to-br from-white to-blue-50/10 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">تعداد تامین‌کنندگان فعال</span>
            <span className="text-xl font-bold text-slate-800 block mt-0.5">{totalSuppliers} شرکت</span>
          </div>
        </div>

        {/* Highest Returns Rate */}
        <div id="kpi-return-rate" className="bg-gradient-to-br from-white to-red-50/10 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
            <RotateCcw size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">بیشترین نرخ مرجوعی تامین</span>
            <span className="text-base font-bold text-slate-800 block mt-0.5">
              {worstSupplier ? `${worstSupplier.name} (${worstSupplier.returnRate}%)` : "نامشخص"}
            </span>
          </div>
        </div>

        {/* Busiest Weekday */}
        <div id="kpi-busy-day" className="bg-gradient-to-br from-white to-amber-50/10 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">پرمعامله‌ترین روز هفته</span>
            <span className="text-xl font-bold text-slate-800 block mt-0.5">
              {highestSalesDay ? `${highestSalesDay.name}` : "نامشخص"}
            </span>
          </div>
        </div>

        {/* Divergences Count */}
        <div id="kpi-divergences" className="bg-gradient-to-br from-white to-rose-50/10 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
            <Boxes size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">اقلام مغایرت منفی انبار</span>
            <span className="text-xl font-bold text-red-600 block mt-0.5">{discrepancyCount} قلم کالا</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Chart Section */}
      <div id="chart-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekday Distribution */}
        <div id="chart-weekday" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            توزیع تراکم درآمد فروش و حجم اسناد در روزهای هفته
          </h3>
          <div className="h-96 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.weekdayArr} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" {...defaultXAxisProps}  />
                <YAxis yAxisId="left" {...defaultYAxisProps} orientation="left"/>
                <YAxis yAxisId="right" {...defaultYAxisProps} />
                <RechartsTooltip 
                  formatter={(val: number, name: string) => {
                    if (name === "مبلغ فروش") return [val.toLocaleString() + " ریال", name];
                    return [val + " سند", name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="salesAmt" name="مبلغ فروش" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="txCount" name="تعداد تراکنش" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procurement Returns Policy */}
        <div id="chart-suppliers" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            ارزیابی تامین‌کنندگان اصلی و نرخ مرجوعی کالاها (%)
          </h3>
          <div className="h-96 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.supplierArr?.slice(0, 10)} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" {...defaultXAxisProps}  />
                <YAxis yAxisId="left" {...defaultYAxisProps} orientation="left"/>
                <YAxis yAxisId="right" {...defaultYAxisProps} orientation="right"/>
                <RechartsTooltip 
                  formatter={(val: number, name: string) => {
                    if (name === "خرید خالص") return [val.toLocaleString() + " ریال", name];
                    return [val + "%", name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="netPurchase" name="خرید خالص" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar yAxisId="right" dataKey="returnRate" name="نرخ مرجوعی" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Market Basket Association List */}
      <div id="complementary-pairings" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Bookmark size={18} className="text-blue-600" />
          تحلیل کالاهای مکمل در سبد فاکتورها (Market Basket Analysis)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          این جدول پر تکرار ترین زوج‌ کالاهایی که با هم در فاکتورهای صندوق خریداری شده‌اند را مدل‌سازی می‌کند. برای چیدمان بهینه قفسه‌ها بسیار موثر است.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data.basketPairs || []).map((pair: any, idx: number) => (
            <div id={`pair-${idx}`} key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between transition-all hover:bg-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                  <span>{pair.p1}</span>
                </div>
                <div className="text-xs text-slate-400 mr-6 font-medium">به همراه</div>
                <div className="text-sm font-medium text-slate-600 mr-6">{pair.p2}</div>
              </div>
              <div className="text-left">
                <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 text-xs rounded-full inline-block">
                  {pair.count} بار تکرار همزمان
                </span>
              </div>
            </div>
          ))}

          {(!data.basketPairs || data.basketPairs.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-6 col-span-3">داده‌ای جهت استخراج پیوندهای سبد خرید یافت نشد.</p>
          )}
        </div>
      </div>

      {/* Stock Reconciliation & Variance audit Table */}
      <div id="stock-audit-panel" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 justify-between border-b border-slate-100 pb-5 mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Boxes className="text-blue-600" size={20} />
              کنترل مغایرت هوشمند و حسابرسی انحرافات انبار
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              محاسبه پیوسته موازنه منطقی انبار: (موجودی اول دوره + رسیدهای خرید خالص - فاکتورهای فروش خالص) و شناسایی کسری یا کالاهای با انباشت راکد
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="جستجوی عنوان یا کد کلا..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 font-sans border border-slate-200 rounded-lg pr-9 pl-4 py-1.5 text-sm w-60 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 font-sans border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="discrepancy">دارای کسری انبار (انحراف)</option>
              <option value="stale">راکد و کدهای بدون ارجاع خروج</option>
              <option value="reorder">نیاز به شارژ بحرانی</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <th className="p-3 text-right">کد کالا</th>
                <th className="p-3 text-right">عنوان کالا</th>
                <th className="p-3 text-right">گروه کالا</th>
                <th className="p-3 text-center">موجودی اول دوره</th>
                <th className="p-3 text-center">رسید ورودی (خرید)</th>
                <th className="p-3 text-center">خروجی صندوق (فروش)</th>
                <th className="p-3 text-center">موجودی فرضی فعلی</th>
                <th className="p-3 text-center">وضعیت انطباق انبار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredRepo.map((item: any, idx: number) => {
                const isNegative = item.expectedQty < 0;
                const isZeroSales = item.salesQty === 0;
                const isCritical = item.status.includes("شارژ");

                return (
                  <tr id={`audit-row-${idx}`} key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold text-slate-500">{item.code}</td>
                    <td className="p-3 font-medium text-slate-850">{item.name}</td>
                    <td className="p-3 text-xs text-slate-400">{item.category}</td>
                    <td className="p-3 text-center font-bold text-slate-600">{item.openingQty.toLocaleString()}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">+{item.purchQty.toLocaleString()}</td>
                    <td className="p-3 text-center font-bold text-red-600">-{item.salesQty.toLocaleString()}</td>
                    <td className={`p-3 text-center font-bold ${isNegative ? "text-rose-600 font-extrabold" : "text-slate-700"}`}>
                      {item.expectedQty.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isNegative 
                        ? "bg-rose-50 text-rose-700 border border-rose-200" 
                        : isZeroSales 
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : isCritical
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {isNegative ? (
                          <AlertTriangle size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredRepo.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                    هیچ کالایی متناسب با شرایط فیلتر جستجو یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* FORECAST TAB */}
      {activeTab === 'forecast' && forecastData && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            پیش‌بینی هوشمند فروش (Smart Forecasting)
          </h3>
          <p className="text-sm text-slate-500 mb-6">
             مدل‌سازی روند آتی فروش بر اساس میانگین متحرک روزهای گذشته و تشخیص الگوهای رشد.
          </p>
          <div className="h-96 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" allowDuplicatedCategory={false} {...defaultXAxisProps} />
                <YAxis {...defaultYAxisProps} />
                <RechartsTooltip formatter={(val: number) => val.toLocaleString() + " ریال"} />
                <Legend />
                <Bar data={forecastData.trendData} dataKey="actual" name="فروش واقعی" fill="#94a3b8" barSize={30} radius={[4, 4, 0, 0]} />
                <Line data={forecastData.trendData} type="monotone" dataKey="forecast" name="مدل برازش شده (تطبیق)" stroke="#6366f1" strokeWidth={3} dot={false} />
                <Line data={forecastData.futureForecast} type="monotone" dataKey="projectedSales" name="پیش‌بینی روزهای آتی" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* BREAKEVEN TAB */}
      {activeTab === 'breakeven' && breakevenData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-gradient-to-br from-white to-rose-50/20 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <Target size={24} />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">هزینه‌های ثابت (عملیاتی)</span>
                  <span className="text-xl font-bold text-slate-800 block mt-0.5">{Number(breakevenData.fixedCosts.toFixed(0)).toLocaleString()} ریال</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-blue-50/20 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">ضریب حاشیه فروش (CM Ratio)</span>
                  <span className="text-xl font-bold text-slate-800 block mt-0.5">{(breakevenData.cmRatio * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-emerald-50/20 p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">نقطه سر‌به‌سر (فروش معادل)</span>
                  <span className="text-xl font-bold text-slate-800 block mt-0.5">{Number(breakevenData.breakevenPoint.toFixed(0)).toLocaleString()} ریال</span>
                </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              نمودار تحلیل نقطه سر‌به‌سر (Breakeven Analysis)
            </h3>
            <p className="text-sm text-slate-500 mb-6">
               محل تقاطع خطوط فروش و مجموع هزینه‌ها، نشان‌دهنده میزان فروشی است که در آن سود عملیاتی صفر خواهد بود.
            </p>
            <div className="h-[450px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={breakevenData.chartData} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="salesVolume" {...defaultXAxisProps} tickFormatter={(v) => (v/1000000).toFixed(0) + 'm'} />
                  <YAxis {...defaultYAxisProps} tickFormatter={(v) => (v/1000000).toFixed(0) + 'm'} />
                  <RechartsTooltip formatter={(val: number) => val.toLocaleString() + " ریال"} labelFormatter={(l: number) => "حجم فروش فرضی: " + l.toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="fixedCost" name="هزینه ثابت" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="totalCost" name="مجموع هزینه‌ها (ثابت+متغیر)" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  <Area type="monotone" dataKey="revenue" name="درآمد فروش" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* COST TRENDS TAB */}
      {activeTab === 'costtrends' && costTrendData && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            روند تغییرات بهای تمام شده (نرخ خرید) ۵ کالای پر تکرار
          </h3>
          <p className="text-sm text-slate-500 mb-6">
             نمایش تغییرات تورمی یا کاهش نرخ خرید در طول زمان برای اقلام پرتراکنش انبار.
          </p>
          <div className="h-[500px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" allowDuplicatedCategory={false} {...defaultXAxisProps} />
                <YAxis {...defaultYAxisProps} />
                <RechartsTooltip formatter={(val: number) => val.toLocaleString() + " ریال"} />
                <Legend />
                {costTrendData.series.map((s: any, idx: number) => (
                   <Line 
                      key={s.code} 
                      data={s.data} 
                      type="monotone" 
                      dataKey="price" 
                      name={s.name} 
                      stroke={['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][idx % 5]} 
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                   />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

