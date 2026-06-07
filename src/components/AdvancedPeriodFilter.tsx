import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  availableYears?: string[];
}

export default function AdvancedPeriodFilter({ value, onChange, availableYears = [] }: Props) {
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [week, setWeek] = useState<string>("");

  useEffect(() => {
     if (year || month || week) {
       onChange(`ADV:${year}|${month}|${week}`);
     } else {
       if (value.startsWith('ADV:')) {
          onChange(""); 
       }
     }
  }, [year, month, week]);

  useEffect(() => {
     if (!value) {
        setYear(""); setMonth(""); setWeek("");
     }
  }, [value]);

  const years = availableYears && availableYears.length > 0 ? availableYears : ["1401", "1402", "1403", "1404", "1405"];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-700 shadow-sm relative">
       <Calendar size={18} className="text-slate-400 shrink-0" />
       
       <select className="bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0" value={year} onChange={e => setYear(e.target.value)}>
          <option value="">همه سال‌ها</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
       </select>
       <span className="text-slate-300">|</span>
       <select className="bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0" value={month} onChange={e => setMonth(e.target.value)}>
          <option value="">همه ماه‌ها</option>
          <option value="1">فروردین</option>
          <option value="2">اردیبهشت</option>
          <option value="3">خرداد</option>
          <option value="4">تیر</option>
          <option value="5">مرداد</option>
          <option value="6">شهریور</option>
          <option value="7">مهر</option>
          <option value="8">آبان</option>
          <option value="9">آذر</option>
          <option value="10">دی</option>
          <option value="11">بهمن</option>
          <option value="12">اسفند</option>
       </select>
       <span className="text-slate-300">|</span>
       <select className="bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px]" value={week} onChange={e => setWeek(e.target.value)}>
          <option value="">همه هفته‌ها</option>
          {Array.from({length: 53}).map((_, i) => (
             <option key={i+1} value={i+1}>هفته {i+1}</option>
          ))}
       </select>
    </div>
  );
}
