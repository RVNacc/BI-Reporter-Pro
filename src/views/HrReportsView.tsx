import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect } from "react";
import {
  Users,
  Coins,
  ScanLine,
  ChevronDown,
  Settings,
  X,
  Clock,
  Briefcase,
  TrendingUp,
  ShoppingCart,
  Award,
  AlertCircle,
  Activity
} from "lucide-react";
import HelpModal from "../components/HelpModal";
import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";
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
  PieChart,
  Pie
} from "recharts";

export default function HrReportsView() {
  const [activeTab, setActiveTab] = useState("commission");
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<string>("");
  const [scanCalcMethod, setScanCalcMethod] = useState<string>("hr");
  const [commissionRate, setCommissionRate] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    fetch(`/api/reports/hr?period=${period}&scanCalcMethod=${scanCalcMethod}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [period, scanCalcMethod]);

  const tabs = [
    {
      id: "commission",
      label: "داشبورد محاسبه پورسانت",
      icon: <Coins size={16} />,
    },
    {
      id: "efficiency",
      label: "ارزیابی راندمان اسکن",
      icon: <ScanLine size={16} />,
    },
    {
      id: "attendance",
      label: "تحلیل حضور و غیاب و اضافه‌کار",
      icon: <Clock size={16} />,
    },
    {
      id: "basketRules",
      label: "کیفیت سبد و ارزش‌آفرینی",
      icon: <ShoppingCart size={16} />,
    },
    {
      id: "trafficTrends",
      label: "روند ترافیک و توزیع تقاضا",
      icon: <TrendingUp size={16} />,
    },
    {
      id: "laborEfficiency",
      label: "بهره‌وری پرسنل و بهینه‌سازی شیفت (RPLH)",
      icon: <Activity size={16} />,
    },
    {
      id: "orgStructure",
      label: "ساختار سازمانی و گردش کار (Turnover)",
      icon: <Users size={16} />,
    },
  ];

  if (!data) return <div className="p-6 flex justify-center items-center h-full text-slate-500 font-medium">در حال بارگذاری...</div>;
  const isEmptyData = data && 
    (!data.hrAnalytics || data.hrAnalytics.length === 0) &&
    (!data.hourlyArr || data.hourlyArr.length === 0);

  if (isEmptyData) {
    return (
      <div className="p-6 h-full flex flex-col bg-slate-50/50 space-y-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
          <AdvancedPeriodFilter
            value={period}
            onChange={setPeriod}
            availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]}
          />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[450px] border border-slate-200 rounded-xl bg-white shadow-sm p-10">
          <Users size={64} className="text-slate-200 mb-6" />
          <p className="text-lg text-slate-500 font-bold mb-2">داده‌ای یافت نشد.</p>
          <p className="text-slate-400 font-medium">هیچ اطلاعات حضور غیاب یا عملکرد پرسنل تنظیم نشده است.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 h-full flex flex-col overflow-auto print:overflow-visible print:h-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-fuchsia-500 pr-3">
            تحلیل جامع منابع انسانی و پرسنل
          </h1>
          <p className="text-slate-500 text-sm">
            ارزیابی ۳۶۰ درجه عملکرد فروشگاه، شامل گزارشات ورود/خروج، کیفیت فروش و راندمان زمانی
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ExportPrintButtons moduleName="hr" period={period} fileName={`HR_Advanced_Report_${period||"All"}`} />
          
          <select 
            value={scanCalcMethod} 
            onChange={(e) => setScanCalcMethod(e.target.value)}
            className="border border-slate-200 rounded-lg p-2 text-sm bg-white shadow-sm"
          >
            <option value="hr">مبنای ساعات حضور/غیاب</option>
            <option value="first_last">مبنای اولین و آخرین اسکن روز</option>
            <option value="active_hours">مبنای ساعات فعال (ثبت صندوق)</option>
            <option value="fixed_shift">مبنای شیفت ثابت (۸ ساعت)</option>
          </select>

          <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
        </div>
      </div>

      <div className="flex bg-white rounded-lg p-1 border border-slate-200 mb-6 shrink-0 w-max max-w-full overflow-x-auto shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-fuchsia-50 text-fuchsia-700 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-fuchsia-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full min-h-[450px]">
        {/* TAB 1: POROSANT */}
        {activeTab === "commission" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Coins className="text-fuchsia-600" />
                گزارش پاداش و پورسانت صندوق‌داران بر اساس عملکرد شمارشی
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings size={16} />
                  تنظیمات پیشرفته مبنا
                </button>
                <HelpModal
                  title="محاسبه پورسانت"
                  content="پورسانت صندوقداران بر اساس شمارش تعداد اقلام اسکن شده در فایل رکورد‌های فروش ضربدر مبلغ پایه استخراج می‌گردد."
                />
              </div>
            </div>

            {data.hrAnalytics?.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">رتبه</th>
                      <th className="py-3 px-4 font-bold">شماره / نام پرسنل</th>
                      <th className="py-3 px-4 font-bold text-center">تعداد اسکن کالا</th>
                      <th className="py-3 px-4 font-bold text-center">بهای کل اسکن‌شده</th>
                      <th className="py-3 px-4 font-bold text-center">پاداش متغیر (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {data?.hrAnalytics?.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400">#{i+1}</td>
                        <td className="py-3 px-4 font-bold text-fuchsia-700 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                            {item.employeeName.charAt(0)}
                          </div>
                          {item.employeeName}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {item.scans.toLocaleString()} <span className="font-normal text-xs text-slate-400">آیتم</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {item.salesValue.toLocaleString()} <span className="font-normal text-xs text-slate-400">ریال</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">
                          {commissionRate ? (
                            (item.scans * Number(commissionRate)).toLocaleString()
                          ) : (
                            <span className="text-amber-600 font-normal text-xs bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                              نیازمند تنظیم مبنا
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
                <Coins size={40} className="mb-4 text-slate-300" />
                <p>داده‌ای برای ارزیابی یافت نشد.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EFFICIENCY */}
        {activeTab === "efficiency" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <ScanLine className="text-blue-500" />
                ارزیابی راندمان و سرعت عملیاتی اسکن (Items/Hour)
              </h3>
              <HelpModal
                title="گزارش راندمان"
                content="این نمودار سرعت اسکن آیتم‌ها را بر اساس مجموع ساعت کارکرد از تفاضل فایل ورود و خروج یا بصورت تخمینی به نمایش می‌گذارد."
              />
            </div>
            
            {data.hrAnalytics?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.hrAnalytics?.map((item: any, i: number) => {
                  const efficiencyRate = Math.min(Math.round((item.itemsPerMinute / 10) * 100), 100); // Ex: if >10 items/min is 100%
                  
                  return (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {i < 3 && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                          Top {i+1}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                           {item.employeeName.substring(0, 2)}
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800 text-sm">{item.employeeName}</h4>
                            <p className="text-xs text-slate-500">{item.workingHours} ساعت کارکرد ثبت‌شده</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-slate-600">سرعت اسکن آیتم</span>
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-blue-600 text-sm">{item.itemsPerMinute} / دقیقه</span>
                                <span className="text-xs text-slate-500">{item.itemsPerHour} / ساعت</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((item.itemsPerMinute/30)*100, 100)}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">راندمان عملکرد سیستمیک</span>
                          <span className="font-extrabold text-slate-800">{efficiencyRate}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
                <ScanLine size={40} className="mb-4 text-slate-300" />
                <p>گزارش راندمان قابل استخراج نیست.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ATTENDANCE & OVERTIME */}
        {activeTab === "attendance" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Clock className="text-orange-500" />
                تحلیل حضور و غیاب، تخطی و اضافه‌کاری پرسنل
              </h3>
              <HelpModal
                title="مدیریت تایم‌شیت"
                content="ردیابی پرسنلی که نقص خروج دارند، میزان ساعت اضافه کاری و تاخیر‌های ثبت شده بر پایه فایل HR"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">نام پرسنل</th>
                    <th className="py-3 px-4 font-bold text-center">روزهای حضور</th>
                    <th className="py-3 px-4 font-bold text-center">مجموع ساعات حضوری</th>
                    <th className="py-3 px-4 font-bold text-center text-orange-600">موارد تاخیر در ورود</th>
                    <th className="py-3 px-4 font-bold text-center text-emerald-600">ساعات اضافه‌کار تحلیلی</th>
                    <th className="py-3 px-4 font-bold text-center text-rose-600">خروج‌ثبت‌نشده (اخطار)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {data?.hrAnalytics?.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{item.employeeName}</td>
                      <td className="py-3 px-4 text-center font-semibold">{item.workingDays} روز</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-600 bg-slate-50/50">{item.workingHours} ساعت</td>
                      <td className="py-3 px-4 text-center font-bold text-orange-600">{item.lateArrivals} بار</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{item.overtimeHours} h</td>
                      <td className="py-3 px-4 text-center">
                        {item.missingExit > 0 ? (
                           <span className="inline-flex flex-row-reverse items-center justify-center gap-1 bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded border border-rose-200">
                             <AlertCircle size={14} />
                             {item.missingExit} مورد
                           </span>
                        ) : (
                           <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BASKET RULES */}
        {activeTab === "basketRules" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <ShoppingCart className="text-emerald-500" />
                  ارزیابی ارزش‌آفرینی در سبد صندوق (Basket Quality Analysis)
                </h3>
                <HelpModal
                  title="کیفیت سبد"
                  content="نمایش توانایی بازاریابی و ارزش آفرینی پرسنل در ترغیب مشتری به خرید بیشتر (Basket Size & Basket Value)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.hrAnalytics?.filter((i:any) => i.invoiceCount > 0).map((item: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                             <Award className="text-emerald-500" size={16} /> {/* Decorator */}
                             {item.employeeName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">تعداد صورتحساب‌های صادرشده: <span className="font-bold text-slate-700">{item.invoiceCount} فاکتور</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <span className="block text-xs text-slate-500 mb-1 font-medium">اندازه سبد خرید (متوسط تعداد)</span>
                            <span className="block text-lg font-bold text-emerald-600">{item.basketSize} اقلام</span>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <span className="block text-xs text-slate-500 mb-1 font-medium">ارزش متوسط یک سبد (ریال)</span>
                            <span className="block text-[15px] font-extrabold text-slate-800">
                              {(item.basketValue / 1000).toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">K</span>
                            </span>
                         </div>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* TAB 5: TRAFFIC TRENDS */}
        {activeTab === "trafficTrends" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <TrendingUp className="text-violet-600" />
                  روند ترافیک فصلی/هفتگی مراجعات (مدیریت تخصیص شیفت)
                </h3>
             </div>
             <div className="h-96 w-full mt-4" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.trendArr} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" {...defaultXAxisProps}  />
                      <YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />
                      <YAxis yAxisId="right" {...defaultYAxisProps} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="txCount" name="حجم آیتم‌های اسکن شده (فشار تراکم)" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="salesAmt" name="ارزش تراکنش‌های صندوق (ریال)" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>
        )}

        {/* TAB 6: LABOR EFFICIENCY (BI KPI & HEATMAP) */}
        {activeTab === "laborEfficiency" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Activity className="text-red-500" />
                  تحلیل ظرفیت و بهره‌وری نیروی کار مدیریت‌شده (Labor Optimization)
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                   <span className="block text-xs text-slate-500 font-medium mb-2">درآمد به ازای هر ساعت کار (RPLH)</span>
                   <span className="block text-xl font-bold text-emerald-600">
                     {data.kpis?.revenuePerStaffHour ? (data.kpis.revenuePerStaffHour / 1000).toLocaleString() : 0} <span className="text-sm font-normal text-slate-400">هزار ریال</span>
                   </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                   <span className="block text-xs text-slate-500 font-medium mb-2">تراکنش به ازای هر ساعت کار (TLH)</span>
                   <span className="block text-xl font-bold text-blue-600">
                     {data.kpis?.txPerStaffHour ? data.kpis.txPerStaffHour.toFixed(1) : 0} <span className="text-sm font-normal text-slate-400">فاکتور</span>
                   </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                   <span className="block text-xs text-slate-500 font-medium mb-2">مجموع ساعات کاری پردازش‌شده</span>
                   <span className="block text-xl font-bold text-slate-700">
                     {data.kpis?.totalWorkingHours ? data.kpis.totalWorkingHours.toLocaleString() : 0} <span className="text-sm font-normal text-slate-400">ساعت</span>
                   </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                   <span className="block text-xs text-slate-500 font-medium mb-2">ضریب اضافه‌کاری نسبت به کارکرد</span>
                   <span className="block text-xl font-bold text-red-500">
                     {data.kpis?.overtimeRatio ? data.kpis.overtimeRatio.toFixed(1) : 0} <span className="text-sm font-normal text-slate-400">%</span>
                   </span>
                </div>
             </div>

             <h4 className="font-semibold text-slate-600 text-sm mb-4">نمودار تقاطع حضور پرسنل با بار ترافیک فروش (تشخیص تجمع نیرو)</h4>
             <div className="h-72 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.hourlyArr} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="hour" {...defaultXAxisProps}  />
                      <YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />
                      <YAxis yAxisId="right" {...defaultYAxisProps} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="txCount" name="تعداد تراکنش‌های ثبت‌شده (بار کاری)" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="staffHours" name="تعداد نفر-ساعت در حال انجام کار" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>
        )}

        {/* TAB 7: ORG STRUCTURE & TURNOVER */}
        {activeTab === "orgStructure" && data && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto pr-2 pb-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Users className="text-indigo-500" />
                  ساختار سازمانی و گردش کار پرسنل (Turnover)
                </h3>
                <HelpModal
                  title="تحلیل منابع انسانی"
                  content="نمایش آمار پرسنل فعال، ترک کار و توزیع آنها بر اساس نقش و مرکز هزینه. این اطلاعات از فایل HR و ستون‌‌های 'سمت'، 'مرکز هزینه'، 'شروع کار' استخراج می‌شود."
                />
             </div>

             {data?.orgStats ? (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border text-center border-slate-200 rounded-xl p-4 shadow-sm">
                       <span className="block text-xs text-slate-500 font-medium mb-1">مجموع پرسنل ثبت شده</span>
                       <span className="block text-2xl font-bold text-slate-700">{data?.orgStats.totalEmployees || 0}</span>
                    </div>
                    <div className="bg-indigo-50 text-center border border-indigo-100 rounded-xl p-4 shadow-sm">
                       <span className="block text-xs text-indigo-500 font-medium mb-1">پرسنل فعال مدار</span>
                       <span className="block text-2xl font-bold text-indigo-700">{data?.orgStats.activeEmployees || 0}</span>
                    </div>
                    <div className="bg-rose-50 text-center border border-rose-100 rounded-xl p-4 shadow-sm">
                       <span className="block text-xs text-rose-500 font-medium mb-1">ترک کار / خروج (Leavers)</span>
                       <span className="block text-2xl font-bold text-rose-600">{data?.orgStats.leavers || 0}</span>
                    </div>
                    <div className="bg-emerald-50 text-center border border-emerald-100 rounded-xl p-4 shadow-sm">
                       <span className="block text-xs text-emerald-600 font-medium mb-1">جذب جدید در دوره (Joiners)</span>
                       <span className="block text-2xl font-bold text-emerald-600">{data?.orgStats.newJoiners || 0}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 h-72">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col">
                       <h4 className="text-sm font-semibold text-slate-600 mb-4 text-center">توزیع پرسنل به تفکیک سمت (Role)</h4>
                       <div className="flex-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={Object.entries(data?.orgStats.rolesDistribution || {}).map(([name, value]) => ({ name, value }))}
                               cx="50%"
                               cy="50%"
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                             >
                               {Object.keys(data?.orgStats.rolesDistribution || {}).map((_, index) => (
                                 <Cell key={`cell-${index}`} fill={["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 5]} />
                               ))}
                             </Pie>
                             <RechartsTooltip />
                             <Legend />
                           </PieChart>
                         </ResponsiveContainer>
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col">
                       <h4 className="text-sm font-semibold text-slate-600 mb-4 text-center">توزیع پرسنل به تفکیک شعبه/مرکز</h4>
                       <div className="flex-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={Object.entries(data?.orgStats.costCenterDistribution || {}).map(([name, value]) => ({ name, value }))}
                               cx="50%"
                               cy="50%"
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                             >
                               {Object.keys(data?.orgStats.costCenterDistribution || {}).map((_, index) => (
                                 <Cell key={`cell-${index}`} fill={["#6366f1", "#14b8a6", "#f43f5e", "#8b5cf6", "#eab308"][index % 5]} />
                               ))}
                             </Pie>
                             <RechartsTooltip />
                             <Legend />
                           </PieChart>
                         </ResponsiveContainer>
                       </div>
                    </div>
                 </div>

                 <div className="overflow-x-auto rounded-lg border border-slate-200 mt-6">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 font-bold">شماره / نام پرسنل</th>
                          <th className="py-3 px-4 font-bold">سمت / نقش</th>
                          <th className="py-3 px-4 font-bold">مرکز هزینه / شعبه</th>
                          <th className="py-3 px-4 font-bold text-center">تاریخ شروع به کار</th>
                          <th className="py-3 px-4 font-bold text-center">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {data?.hrAnalytics?.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                               {item.employeeName}
                               <span className="text-xs text-slate-400 font-normal">({item.employeeCode})</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{item.role || "نامشخص"}</td>
                            <td className="py-3 px-4 text-slate-600">{item.costCenter || "نامشخص"}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">{item.startDate || "-"}</td>
                            <td className="py-3 px-4 text-center">
                              {item.active ? (
                                <span className="inline-block px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                                  فعال
                                </span>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-block px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                                    ترک کار
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.endDate}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
                 <Users size={40} className="mb-4 text-slate-300" />
                 <p>گزارش ساختار سازمانی یافت نشد.</p>
               </div>
             )}
          </div>
        )}

        {/* LOADING STATE */}
        {!data && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center">
            <Users size={48} className="mb-4 text-slate-300 animate-pulse" />
            <p>در حال پردازش داده‌های استراتژیک منابع انسانی...</p>
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Settings className="text-fuchsia-500" />
                تنظیمات مبنای پاداش
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                مبلغ پایه پاداش به ازای هر آیتم اسکن شده (ریال)
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors font-mono"
                placeholder="مثال: 1500"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">
                سیستم مجموع شمارش اقلام اسکن‌شده توسط یک صندوقدار را در این نرخ پایه ضرب نموده و مستقیماً سود متغیر ماهانه/هفتگی را می‌سازد.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium"
              >
                لغو
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                ذخیره تنظیمات سیستم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
