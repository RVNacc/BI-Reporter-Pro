import { 
  LayoutDashboard, 
  FileUp, 
  TrendingUp, 
  PackageSearch, 
  BadgeDollarSign, 
  Users,
  Calculator,
  BarChart3
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "داشبورد مدیریت", icon: <LayoutDashboard size={20} /> },
    { id: "files", label: "مدیریت فایل‌های اکسل", icon: <FileUp size={20} /> },
    { id: "sales", label: "فروش و صندوق‌", icon: <TrendingUp size={20} /> },
    { id: "inventory", label: "انبار و تامین‌کنندگان", icon: <PackageSearch size={20} /> },
    { id: "finance", label: "مالی و خزانه‌داری", icon: <BadgeDollarSign size={20} /> },
    { id: "abc", label: "بهابای تمام شده (ABC)", icon: <Calculator size={20} /> },
    { id: "pareto", label: "گزارشات پارتو", icon: <BarChart3 size={20} /> },
    { id: "weekly", label: "روند فروش هفتگی", icon: <TrendingUp size={20} /> },
    { id: "profit", label: "تحلیل سود و زیان سطوح", icon: <BadgeDollarSign size={20} /> },
    { id: "hr", label: "منابع انسانی", icon: <Users size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed pr-0 pl-0">
      <div className="p-6 text-white text-xl font-bold border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
           <TrendingUp size={18} />
        </div>
        هایپر اِکسل پرو
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right ${
              currentView === item.id 
               ? "bg-blue-600 text-white font-medium" 
               : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 text-xs text-slate-500 border-t border-slate-800">
        نسخه ۱.۰ (تحلیلگر هوشمند)
      </div>
    </div>
  );
}
