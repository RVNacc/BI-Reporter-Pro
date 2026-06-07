import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect } from "react";
import {
  Users,
  Coins,
  ScanLine,
  Calendar,
  ChevronDown,
  Settings,
  X,
} from "lucide-react";
import HelpModal from "../components/HelpModal";
import ExportPrintButtons from "../components/ExportPrintButtons";

export default function HrReportsView() {
  const [activeTab, setActiveTab] = useState("commission");
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<string>("");
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
    fetch(`/api/reports/hr?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [period]);

  const tabs = [
    {
      id: "commission",
      label: "محاسبه پورسانت و پاداش",
      icon: <Coins size={16} />,
    },
    {
      id: "efficiency",
      label: "راندمان اسکن صندوقداران",
      icon: <ScanLine size={16} />,
    },
  ];

  return (
    <div className="p-6 md:p-8 h-full flex flex-col overflow-auto print:overflow-visible print:h-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-fuchsia-500 pr-3">
            منابع انسانی و پرسنل
          </h1>
          <p className="text-slate-500 text-sm">
            پایش راندمان عملکرد ۱۰۰+ پرسنل فعال و صندوق‌داران
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportPrintButtons moduleName="hr" period={period} fileName="HR_Report" />
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
                ? "bg-fuchsia-50 text-fuchsia-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full min-h-[400px]">
        {activeTab === "commission" && data && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-700">
                گزارش پاداش و پورسانت صندوق‌داران بر اساس عملکرد
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings size={16} />
                  تنظیمات پیشرفته
                </button>
                <HelpModal
                  title="محاسبه پورسانت"
                  content="پورسانت صندوقداران بر اساس شمارش تعداد اقلام اسکن شده در فایل رکورد‌های فروش (کد صندوقدار/نام مرکز هزینه) استخراج و محاسبه می‌گردد."
                />
              </div>
            </div>

            {data.commissionArr?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-medium">
                        نام پرسنل / کُد صندوق
                      </th>
                      <th className="py-3 px-4 font-medium">تعداد اسکن کالا</th>
                      <th className="py-3 px-4 font-medium">
                        مبلغ پاداش متغیر (ریال)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {data.commissionArr.map((item: any, i: number) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-fuchsia-700">
                          {item.employee}
                        </td>
                        <td className="py-3 px-4">
                          {item.scans.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {commissionRate ? (
                            (
                              item.scans * Number(commissionRate)
                            ).toLocaleString()
                          ) : (
                            <span className="text-amber-600 font-normal text-xs bg-amber-50 px-2 py-1 rounded">
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
                <p>داده‌ای برای ارزیابی پورسانت در این دوره یافت نشد.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "efficiency" && data && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-700">
                راندمان کلی و میانگین سرعت اسکن (Items/Min)
              </h3>
              <HelpModal
                title="گزارش راندمان"
                content="جهت نمایش راندمان زمانی، نیازمند بارگذاری فایل کامل شیفت‌های کاری پرسنل هستیم."
              />
            </div>
            {data.efficiencyArr?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {data.efficiencyArr.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-6"
                  >
                    <h4 className="font-medium text-slate-700 mb-4">
                      {item.name}
                    </h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">
                        راندمان عملکرد
                      </span>
                      <span className="font-bold text-fuchsia-600">
                        {item.efficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
                      <div
                        className="bg-fuchsia-500 h-2.5 rounded-full"
                        style={{ width: `${item.efficiency}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">
                        متوسط سرعت اسکن کالا
                      </span>
                      <span className="font-bold bg-white border border-slate-200 px-3 py-1 rounded-md">
                        {item.itemsPerMinute} کالادر دقیقه
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed p-10">
                <ScanLine size={40} className="mb-4 text-slate-300" />
                <p>گزارش راندمان برای اطلاعات ثبت شده قابل استخراج نیست.</p>
              </div>
            )}
          </div>
        )}

        {!data && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center">
            <Users size={48} className="mb-4 text-slate-300 animate-pulse" />
            <p>در حال پردازش داده‌های رفتاری پرسنل...</p>
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Settings className="text-fuchsia-500" />
                تنظیمات پورسانت
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
                مبلغ پایه پاداش به ازای هر اسکن (ریال)
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                placeholder="مثال: 1000"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-2">
                تنها در صورت تعیین کردن مبلغ پایه، سامانه قادر به محاسبه پاداش
                نهایی برای هر صندوق‌دار خواهد بود.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium"
              >
                بستن
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
