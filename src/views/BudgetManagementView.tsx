import React, { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart4
} from "lucide-react";
import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import ExportPrintButtons from "../components/ExportPrintButtons";

export default function BudgetManagementView() {
  const [period, setPeriod] = useState<string>("");
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState("فروش (درآمد)");
  const [newCategory, setNewCategory] = useState("کلی");

  useEffect(() => {
    fetch("/api/periods")
      .then((res) => res.json())
      .then((data) => setAvailablePeriods(data || []))
      .catch(console.error);
  }, []);

  const fetchData = async () => {
    if (!period) return;
    setLoading(true);
    try {
      const [budgetsRes, varianceRes] = await Promise.all([
        fetch(`/api/budgets?period=${period}`),
        fetch(`/api/reports/budget-variance?period=${period}`)
      ]);
      if (budgetsRes.ok) setBudgets(await budgetsRes.json());
      if (varianceRes.ok) {
         const vData = await varianceRes.json();
         setVarianceData(vData.varianceList || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleAddBudget = async () => {
    if (!period || !newTitle || !newAmount) {
        alert("لطفاً دوره، عنوان و مبلغ بودجه را وارد کنید.");
        return;
    }
    try {
      await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          title: newTitle,
          amount: parseFloat(newAmount),
          type: newType,
          category: newCategory
        }),
      });
      setNewTitle("");
      setNewAmount("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col justify-start overflow-auto print:overflow-visible print:h-auto print:p-2 print:block">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-emerald-500 pr-3">
            مدیریت بودجه و کنترل انحرافات
          </h1>
          <p className="text-slate-500 text-sm">
            هدف‌گذاری استراتژیک، تخصیص بودجه و پایش لحظه‌ای انحرافات مالی و عملکردی
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500">دوره مالی بودجه:</span>
              <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={availablePeriods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           <div className="flex flex-col justify-end gap-1 self-stretch pb-0.5">
              <ExportPrintButtons data={varianceData} fileName="Budget_Variance" />
           </div>
        </div>
      </div>

      {!period ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
              <Target size={48} className="mb-4 text-slate-300" />
              <p>لطفاً یک دوره زمانی را برای مشاهده یا ثبت بودجه انتخاب کنید.</p>
          </div>
      ) : (
          <>
            {/* Entry Form */}
            <div className="print:hidden bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <Plus size={20} className="text-emerald-500" />
                تعریف بودجه جدید
              </h2>
              <div className="flex flex-wrap gap-4 mb-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input
                  type="text"
                  placeholder="عنوان ردیف بودجه"
                  className="border rounded-lg p-2.5 flex-1 min-w-[200px] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="مبلغ مصوب (ریال)"
                  className="border rounded-lg p-2.5 flex-1 min-w-[200px] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
                <select
                  className="border rounded-lg p-2.5 flex-1 min-w-[150px] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="فروش (درآمد)">فروش (درآمد)</option>
                  <option value="تامین (خرید)">تامین (خرید)</option>
                  <option value="هزینه‌های عملیاتی">هزینه‌های عملیاتی</option>
                </select>
                <select
                  className="border rounded-lg p-2.5 flex-1 min-w-[150px] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="کلی">سطح کل سازمان</option>
                </select>
                
                <button
                  onClick={handleAddBudget}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Plus size={18} /> ثبت بودجه
                </button>
              </div>
            </div>

            {/* List and Variance Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none mb-8">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:bg-white print:border-none">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <BarChart4 size={20} className="text-blue-500" />
                        تحلیل انحرافات بودجه و عملکرد
                    </h3>
                </div>
                
                <div className="overflow-x-auto p-5 text-slate-900">
                    <table className="w-full text-right text-sm border-collapse">
                        <thead className="bg-[#1e293b] text-slate-200">
                            <tr>
                                <th className="p-3 font-medium rounded-tr-lg">ردیف / عنوان</th>
                                <th className="p-3 font-medium">نوع جریان</th>
                                <th className="p-3 font-medium">بودجه مصوب (ریال)</th>
                                <th className="p-3 font-medium">عملکرد واقعی (ریال)</th>
                                <th className="p-3 font-medium">مبلغ انحراف (ریال)</th>
                                <th className="p-3 font-medium">درصد تحقق</th>
                                <th className="p-3 font-medium">وضعیت</th>
                                <th className="p-3 font-medium rounded-tl-lg print:hidden">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {varianceData.map((item: any) => {
                                const isIncome = item.type === "فروش (درآمد)";
                                const isFavorable = isIncome ? item.varianceAmount >= 0 : item.varianceAmount <= 0;
                                
                                return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-semibold text-slate-700">{item.title}</td>
                                    <td className="p-3 text-slate-500 text-xs">{item.type}</td>
                                    <td className="p-3 font-mono text-slate-800">{Number(item.budgetAmount).toLocaleString()}</td>
                                    <td className="p-3 font-mono font-medium text-blue-700">{Number(item.actualAmount).toLocaleString()}</td>
                                    <td className={`p-3 font-mono font-bold ${isFavorable ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                                        {item.varianceAmount > 0 ? "+" : ""}{Number(item.varianceAmount).toLocaleString()}
                                    </td>
                                    <td className="p-3 w-48">
                                        <div className="flex items-center gap-2">
                                            <div className="font-mono text-xs w-12 text-left">{item.variancePercent.toFixed(1)}%</div>
                                            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden relative">
                                                <div 
                                                    className={`absolute top-0 right-0 h-full rounded-full ${item.variancePercent > 100 ? (isIncome ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(100, item.variancePercent)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {isFavorable ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-3 print:hidden">
                                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                                )
                            })}
                            
                            {varianceData.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">
                                        هیچ بودجه‌ای برای این دوره تعریف نشده است.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </>
      )}
    </div>
  );
}
