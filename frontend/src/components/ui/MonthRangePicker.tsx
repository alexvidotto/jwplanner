import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth, isWithinInterval, startOfMonth, endOfMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

export const MonthRangePicker = ({ startDate, endDate, onChange }: MonthRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleMonthClick = (monthIndex: number) => {
    const clickedDate = new Date(viewYear, monthIndex, 1);
    
    // Logic:
    // 1. If start is set but end is not (or end == start), set end.
    // 2. If both are set and different, reset to just start.
    // 3. Ensure start <= end.

    // Calculate current diff
    const isSame = isSameMonth(startDate, endDate);
    
    if (!isSame) {
      // Range is already selected, start fresh
      onChange(startOfMonth(clickedDate), endOfMonth(clickedDate));
    } else {
      // Only start is effectively selected (or same), try to close range
      if (clickedDate < startDate) {
        // User clicked before start, so that becomes new start
        onChange(startOfMonth(clickedDate), endOfMonth(startDate));
        setIsOpen(false);
      } else {
        // User clicked after start, that becomes end
        onChange(startOfMonth(startDate), endOfMonth(clickedDate));
        setIsOpen(false);
      }
    }
  };

  const getMonthClass = (monthIndex: number) => {
    const date = new Date(viewYear, monthIndex, 1);
    const isStart = isSameMonth(date, startDate);
    const isEnd = isSameMonth(date, endDate);
    const inRange = isWithinInterval(date, { start: startDate, end: endDate });

    let base = "w-full py-2 text-sm rounded-lg transition-colors font-medium ";
    
    if (isStart || isEnd) {
      return base + "bg-blue-600 text-white hover:bg-blue-700";
    }
    if (inRange) {
      return base + "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
    return base + "text-gray-700 hover:bg-gray-100";
  };

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-sm font-medium text-gray-700 w-64 justify-between"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-gray-400" />
          <span>
            {format(startDate, 'MMM/yy', { locale: ptBR })} - {format(endDate, 'MMM/yy', { locale: ptBR })}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-72 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewYear(y => y - 1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-gray-800">{viewYear}</span>
            <button onClick={() => setViewYear(y => y + 1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {months.map(m => (
              <button
                key={m}
                onClick={() => handleMonthClick(m)}
                className={getMonthClass(m)}
              >
                {format(new Date(viewYear, m, 1), 'MMM', { locale: ptBR }).toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-center text-gray-400 border-t pt-2">
            Selecione o mês inicial e o final
          </div>
        </div>
      )}
    </div>
  );
};
