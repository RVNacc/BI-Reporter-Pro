import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useEffect, useState } from "react";
import {
  BarChart as BarChartIcon,
  TrendingUp,
  PieChart as PieChartIcon,
  ChevronDown,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import HelpModal from "../components/HelpModal";
import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

export default function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<string>(""); // empty means all dates

  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([
    { value: "", label: "همه دوره‌ها" },
  ]);

  useEffect(() => {
    fetch("/api/periods")
      .then((res) => res.json())
      .then(setPeriods)
      .catch(console.error);
  }, []);

  const fetchDashboard = () => {
    fetch(`/api/dashboard?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (!data)
    return (
      <div className="p-10 text-center text-slate-500">
        در حال دریافت داده‌ها...
      </div>
    );
    
  if (data.error) {
    return (
      <div className="p-10 text-center text-red-500">
        {data.error}
      </div>
    );
  }
  
  if (!data.kpis) {
      return (
          <div className="p-10 text-center text-slate-500">
            داده‌ای برای نمایش یافت نشد. لطفاً اطلاعات را در قسمت مدیریت فایل آپلود کنید.
          </div>
      );
  }

  return (
    <div className="p-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-blue-500 pr-3 flex items-center gap-3">
            داشبورد مدیریت کلان
            <HelpModal
              title="راهنمای داشبورد"
              content="در این صفحه، شاخص‌های کلان بر مبنای تجمیع اطلاعات فایل‌های فروش، خریدهای انبار و گزارشات بانکی استخراج می‌گردد. حاشیه سود بر مبنای کسر خروجی‌های مالی نسبت به ورود نقدی محاسبه می‌گردد. همچنین برای مشاهده مقادیر صحیح حتما باید دوره‌ها تفکیک شده باشند."
            />
          </h1>
          <p className="text-slate-500 text-sm">
            خلاصه وضعیت عملکردی مجتمع (نمای ۳۶۰ درجه)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportPrintButtons moduleName="sales" period={period} fileName="Dashboard_Sales" />
          <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          title="فروش خالص کل"
          value={`${(data.kpis.totalSales / 10000000).toLocaleString()}`}
          unit="میلیون تومان"
          icon={<TrendingUp />}
          color="blue"
        />
        <KpiCard
          title="موجودی و سرمایه درگردش"
          value={`${(data.kpis.inventoryValue / 10000000).toLocaleString()}`}
          unit="میلیون تومان"
          icon={<BarChartIcon />}
          color="emerald"
        />
        <KpiCard
          title="حاشیه سود خالص (متوسط)"
          value={data.kpis.netProfitMargin.toString()}
          unit="درصد"
          icon={<PieChartIcon />}
          color="amber"
        />
        <KpiCard
          title="نرخ سرریز/کسری انبار"
          value={data.kpis.shrinkageRate.toString()}
          unit="درصد"
          icon={<TrendingUp className="rotate-180" />}
          color="red"
        />
      </div>

      {data.extremes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-r-4 border-r-blue-500 flex flex-col">
              <span className="text-xs text-slate-500 mb-1">بیشترین فروش کالا</span>
              <span className="font-bold text-slate-800 line-clamp-1 mb-1">{data.extremes.topProd?.name || '-'}</span>
              <span className="text-sm text-blue-600 font-bold">{data.extremes.topProd?.amt?.toLocaleString() || 0} ریال</span>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-r-4 border-r-rose-500 flex flex-col">
              <span className="text-xs text-slate-500 mb-1">کمترین فروش کالا (مثبت)</span>
              <span className="font-bold text-slate-800 line-clamp-1 mb-1">{data.extremes.botProd?.name || '-'}</span>
              <span className="text-sm text-rose-600 font-bold">{data.extremes.botProd?.amt?.toLocaleString() || 0} ریال</span>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-r-4 border-r-emerald-500 flex flex-col">
              <span className="text-xs text-slate-500 mb-1">پرفروش‌ترین تاریخ</span>
              <span className="font-bold text-slate-800 mb-1">{data.extremes.topDate?.date || '-'}</span>
              <span className="text-sm text-emerald-600 font-bold">{data.extremes.topDate?.amt?.toLocaleString() || 0} ریال</span>
           </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6">
            روند فروش - مقایسه‌ای دوره‌ای (ریال)
          </h3>
          <div className="h-[500px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.salesTrend}
                margin={{ top: 20, right: 30, left: 100, bottom: 140 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  angle={-45} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, dx: -10, fill: "#475569", direction: "ltr"}} interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis {...defaultYAxisProps} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    textAlign: "right",
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString() + " ریال",
                    "مبلغ",
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="مبلغ فروش"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pareto / Top Categories */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6">
            پارتو ریالی گروه‌های کالایی اصلی
          </h3>
          <div className="h-[500px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.paretoData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 140 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis {...hideAxisProps} />
                <YAxis dataKey="name" {...verticalYAxisProps} />
                <RechartsTooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ textAlign: "right" }}
                  formatter={(val: number) => val.toLocaleString() + " ریال"}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="ارزش تراکنش">
                  {data?.paretoData?.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  unit,
  icon,
  color,
}: {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
            {value}
          </span>
          <span className="text-slate-500 text-xs font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
}
