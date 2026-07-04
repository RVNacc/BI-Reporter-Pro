import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect } from "react";
import {
  BadgeDollarSign,
  FileSpreadsheet,
  CalendarDays,
  LineChart,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import HelpModal from "../components/HelpModal";
import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

export default function FinanceReportsView() {
  const [activeTab, setActiveTab] = useState("treasury");
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

  useEffect(() => {
    fetch(`/api/reports/finance?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [period]);

  const tabs = [
    {
      id: "treasury",
      label: "جریان نقدینگی (خزانه)",
      icon: <FileSpreadsheet size={16} />,
    },
    {
      id: "margin",
      label: "حاشیه سود کالا (P&L)",
      icon: <BadgeDollarSign size={16} />,
    },
    { id: "aging", label: "صورت‌وضعیت بدهی", icon: <CalendarDays size={16} /> },
    {
      id: "breakeven",
      label: "تحلیل نقطه سر به سر",
      icon: <LineChart size={16} />,
    },
  ];

  if (!data) return <div className="p-6 flex justify-center items-center h-full text-slate-500 font-medium">در حال بارگذاری...</div>;
  if (data?.error) return <div className="p-10 text-center text-red-500">{data.error}</div>;
  return (
    <div className="p-6 md:p-8 h-full flex flex-col overflow-auto print:overflow-visible print:h-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">
            مالی، مالیاتی و خزانه‌داری
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ExportPrintButtons moduleName="treasury" period={period} fileName="Finance_Report" />
          <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
        </div>
      </div>

      <div className="flex bg-white rounded-lg p-1 border border-slate-200 mb-6 shrink-0 w-max max-w-full overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-amber-50 text-amber-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full min-h-[450px]">
        {activeTab === "treasury" && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
            <div className="absolute top-0 right-0 -mt-2">
              <HelpModal
                title="جریان نقدینگی (خزانه)"
                content="این مقادیر از تجمیع مبالغ موجود در فایل مربوط به تراکنش‌های مالی و بانکی (بدهکار/بستانکار، ورود/خروج) محاسبه می‌شود."
              />
            </div>
            <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-6 flex items-center gap-4 mt-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowUpRight size={32} />
              </div>
              <div>
                <h3 className="text-slate-500 font-medium mb-1">
                  ورودی نقدینگی (درآمد)
                </h3>
                <div className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  {data.income.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    ریال
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-rose-50/50 rounded-xl border border-rose-100 p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ArrowDownRight size={32} />
              </div>
              <div>
                <h3 className="text-slate-500 font-medium mb-1">
                  خروجی نقدینگی (هزینه)
                </h3>
                <div className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  {data.outcome.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    ریال
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "margin" && data && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-700">
                حاشیه سود خالص (P&L) بر اساس گروه کالایی
              </h3>
              <HelpModal
                title="سود و زیان (P&L)"
                content="این گزارش نیازمند شناسایی دقیق درآمدهای فروش و قیمت تمام شده (و هزینه‌های فرعی) به تفکیک رده‌های کالایی است."
              />
            </div>
            {data.marginArr?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-medium">گروه کالایی</th>
                      <th className="py-3 px-4 font-medium">
                        درآمد عملیاتی (ریال)
                      </th>
                      <th className="py-3 px-4 font-medium">
                        حاشیه سود (درصد)
                      </th>
                      <th className="py-3 px-4 font-medium">وضعیت سودآوری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 border-b border-slate-200">
                    {data?.marginArr?.map((item: any, i: number) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 font-medium text-emerald-600">
                          {item.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {item.marginPercent}%
                        </td>
                        <td className="py-3 px-4">
                          {item.marginPercent > 20 ? (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                              مطلوب (Cash Cow)
                            </span>
                          ) : item.marginPercent > 10 ? (
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                              متوسط (Star)
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-medium">
                              پایین (Dog)
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
                <BadgeDollarSign size={40} className="mb-4 text-slate-300" />
                <p>داده‌های لازم برای محاسبه حاشیه سود تفکیکی یافت نشد.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "aging" && data && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-700">
                صورت‌وضعیت بدهی و چک‌های سررسید شده (Aging Report)
              </h3>
              <HelpModal
                title="گزارش سررسید"
                content="برای نمایش معوقات، فایل مالی باید حاوی سوابق چک‌ها و فاکتورهای پرداخت نشده با تاریخ سررسیدِ گذشته باشد."
              />
            </div>
            {data.agingArr?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-medium">
                        نام بدهکار / شرکت
                      </th>
                      <th className="py-3 px-4 font-medium">
                        مدت زمان تاخیر (از سررسید)
                      </th>
                      <th className="py-3 px-4 font-medium">
                        مبلغ بدهی (ریال)
                      </th>
                      <th className="py-3 px-4 font-medium">وضعیت پیگیری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {data?.agingArr?.map((item: any, i: number) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold">
                          {item.debtor}
                        </td>
                        <td className="py-3 px-4 text-rose-600 font-bold">
                          {item.daysOvdue} روز
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {item.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                            ارسال اخطاریه
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
                <CalendarDays size={40} className="mb-4 text-slate-300" />
                <p>هیچ حساب معوقی در داده‌های این دوره یافت نشد.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "breakeven" && data && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-700">
                تحلیل نقطه سر به سر (Break-even Point)
              </h3>
              <HelpModal
                title="نقطه سر به سر"
                content="برای محاسبه این بخش، سیستم نیازمند تشخیص مجموع هزینه‌های ثابت (اجاره، حقوق) و میانگین هزینه متغیر و قیمت فروش هر واحد از فایل‌های سیستم است."
              />
            </div>

            {data.breakevenData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-4xl">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                    <div className="text-slate-500 text-xs mb-1">
                      هزینه ثابت (Fixed Costs)
                    </div>
                    <div className="font-bold text-slate-800">
                      {data.breakevenData.fixedCosts.toLocaleString()} ریال
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                    <div className="text-slate-500 text-xs mb-1">
                      هزینه متغیر هر واحد (VC)
                    </div>
                    <div className="font-bold text-slate-800">
                      {data.breakevenData.variableCostPerUnit.toLocaleString()}{" "}
                      ریال
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                    <div className="text-slate-500 text-xs mb-1">
                      قیمت فروش هر واحد (P)
                    </div>
                    <div className="font-bold text-emerald-600">
                      {data.breakevenData.pricePerUnit.toLocaleString()} ریال
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 text-center shadow-sm">
                    <div className="text-indigo-600 text-xs mb-1 font-medium">
                      نقطه سربه سر (واحدهای مساوی)
                    </div>
                    <div className="font-bold text-indigo-700 text-xl">
                      {data.breakevenData.breakevenUnits.toLocaleString()} واحد
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 p-8 text-center"
                  dir="ltr"
                >
                  <div className="max-w-md">
                    <p className="mb-2">
                      با توجه به الگوی هزینه‌ای و حاشیه سود جاری، فروشگاه در
                      صورت فروش بیش از{" "}
                      <strong className="text-slate-700">
                        {data.breakevenData.breakevenUnits.toLocaleString()}
                      </strong>{" "}
                      واحد کالا در این دوره، وارد <strong>ناحیه سوددهی</strong>{" "}
                      خواهد شد.
                    </p>
                    <p className="text-xs">
                      این رقم بر اساس توزیع هزینه‌های ثابت نسبت به حاشیه سود
                      متغیر استخراج شده است.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
                <LineChart size={40} className="mb-4 text-slate-300" />
                <p>داده‌های کافی برای ترسیم تقاطع نقطه سر به سر مشخص نشد.</p>
              </div>
            )}
          </div>
        )}

        {!data && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center">
            <BadgeDollarSign
              size={48}
              className="mb-4 text-slate-300 animate-pulse"
            />
            <p>در حال بارگذاری داده‌ها...</p>
          </div>
        )}
      </div>
    </div>
  );
}
