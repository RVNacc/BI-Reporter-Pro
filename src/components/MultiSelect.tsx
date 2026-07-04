import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  options: { label: string; value: string }[];
  value: string; // comma-separated values
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'انتخاب کنید', className = '' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedValues = value ? value.split(',') : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optValue: string) => {
    if (optValue === '') {
      onChange(''); // clear all or select default
      return;
    }
    let newValues = [...selectedValues];
    if (newValues.includes(optValue)) {
      newValues = newValues.filter(v => v !== optValue);
    } else {
      newValues.push(optValue);
    }
    // remove empty string if it's there
    newValues = newValues.filter(v => v !== '');
    onChange(newValues.join(','));
  };

  const getDisplayLabel = () => {
    if (selectedValues.length === 0 || (selectedValues.length === 1 && selectedValues[0] === '')) return placeholder;
    if (selectedValues.length === 1) {
      return options.find(o => o.value === selectedValues[0])?.label || placeholder;
    }
    return `${selectedValues.length} مورد انتخاب شده`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        className="w-full bg-slate-50 border rounded px-3 py-1.5 text-sm outline-none text-slate-700 flex justify-between items-center text-right"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate ml-2">{getDisplayLabel()}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-full min-w-[200px] bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((opt, idx) => {
            const isSelected = opt.value === '' ? selectedValues.length === 0 : selectedValues.includes(opt.value);
            return (
              <div 
                key={idx}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                onClick={() => toggleOption(opt.value)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                <span>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
