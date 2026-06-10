import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  availableYears?: string[];
}

export default function AdvancedPeriodFilter({ value, onChange, availableYears = [] }: Props) {
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<"year" | "month" | "week" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     if (years.length || months.length || weeks.length) {
       onChange(`ADV:${years.join(',')}|${months.join(',')}|${weeks.join(',')}`);
     } else {
       if (value.startsWith('ADV:')) {
          onChange(""); 
       }
     }
  }, [years, months, weeks]);

  useEffect(() => {
     if (!value) {
        setYears([]); setMonths([]); setWeeks([]);
     } else if (value.startsWith("ADV:")) {
        const parts = value.substring(4).split('|');
        setYears(parts[0] ? parts[0].split(',') : []);
        setMonths(parts[1] ? parts[1].split(',') : []);
        setWeeks(parts[2] ? parts[2].split(',') : []);
     }
  }, [value]);

  useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
           setOpenDropdown(null);
        }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availYears = availableYears && availableYears.length > 0 ? availableYears : ["1401", "1402", "1403", "1404", "1405", "1406"];

  const monthOptions = [
    { value: "1", label: "فروردین" },
    { value: "2", label: "اردیبهشت" },
    { value: "3", label: "خرداد" },
    { value: "4", label: "تیر" },
    { value: "5", label: "مرداد" },
    { value: "6", label: "شهریور" },
    { value: "7", label: "مهر" },
    { value: "8", label: "آبان" },
    { value: "9", label: "آذر" },
    { value: "10", label: "دی" },
    { value: "11", label: "بهمن" },
    { value: "12", label: "اسفند" },
  ];

  const weekOptions = Array.from({length: 53}).map((_, i) => ({ value: String(i+1), label: `هفته ${i+1}` }));

  const toggleSelection = (val: string, currentSelections: string[], setSelections: React.Dispatch<React.SetStateAction<string[]>>) => {
     if (currentSelections.includes(val)) {
        setSelections(currentSelections.filter(v => v !== val));
     } else {
        setSelections([...currentSelections, val]);
     }
  };

  const MultiSelectDropdown = ({ title, options, selectedValues, setSelections, type }: any) => {
     const isOpen = openDropdown === type;
     const displayTitle = selectedValues.length === 0 ? title : 
                          selectedValues.length === 1 ? options.find((o:any) => o.value === selectedValues[0])?.label :
                          `${title} (${selectedValues.length})`;

     return (
        <div className="relative">
           <div 
              className="flex items-center gap-1 cursor-pointer hover:text-blue-600 px-1 py-0.5 rounded text-slate-700"
              onClick={() => setOpenDropdown(isOpen ? null : type)}
           >
              <span>{displayTitle}</span>
              <ChevronDown size={14} className="text-slate-400" />
           </div>
           
           {isOpen && (
              <div className="absolute top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 right-0 max-h-60 overflow-y-auto">
                 <div 
                    className="px-3 py-2 border-b border-slate-100 text-sm font-medium text-blue-600 cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelections([])}
                 >
                    پاک کردن همه انتخاب‌ها
                 </div>
                 {options.map((opt: any) => {
                    const isSelected = selectedValues.includes(opt.value);
                    return (
                       <div 
                          key={opt.value} 
                          className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                          onClick={() => toggleSelection(opt.value, selectedValues, setSelections)}
                       >
                          <span>{opt.label}</span>
                          {isSelected && <Check size={14} className="text-blue-600" />}
                       </div>
                    );
                 })}
              </div>
           )}
        </div>
     );
  };

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm shadow-sm relative select-none">
       <Calendar size={18} className="text-slate-400 shrink-0" />
       
       <MultiSelectDropdown 
          title="همه سال‌ها" 
          options={availYears.map(y => ({value: y, label: y}))} 
          selectedValues={years} 
          setSelections={setYears} 
          type="year" 
       />
       
       <span className="text-slate-300">|</span>
       
       <MultiSelectDropdown 
          title="همه ماه‌ها" 
          options={monthOptions} 
          selectedValues={months} 
          setSelections={setMonths} 
          type="month" 
       />
       
       <span className="text-slate-300">|</span>
       
       <MultiSelectDropdown 
          title="همه هفته‌ها" 
          options={weekOptions} 
          selectedValues={weeks} 
          setSelections={setWeeks} 
          type="week" 
       />
    </div>
  );
}
