import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval, 
  startOfWeek, 
  addDays,
  isSameWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekPickerProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDateRange = (date: Date) => {
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  const endDate = addDays(startDate, 6);

  const startMonth = format(startDate, 'M');
  const endMonth = format(endDate, 'M');

  if (startMonth === endMonth) {
    return `${format(startDate, 'd')}–${format(endDate, 'd')} de ${capitalize(format(endDate, 'MMMM', { locale: ptBR }))} `;
  } else {
    return `${format(startDate, 'd')} de ${capitalize(format(startDate, 'MMM', { locale: ptBR }))} – ${format(endDate, 'd')} de ${capitalize(format(endDate, 'MMM', { locale: ptBR }))}`;
  }
};

export const WeekPicker = ({ currentDate, onSelectDate, isOpen, onClose }: WeekPickerProps) => {
  const [viewDate, setViewDate] = useState(currentDate);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);

    // We want weeks that cover the month
    // eachWeekOfInterval gives us standard weeks
    return eachWeekOfInterval({
      start: monthStart,
      end: monthEnd
    }, { weekStartsOn: 1 });
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-4 w-80" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {weeks.map((weekStart, idx) => {
            const isSelected = isSameWeek(weekStart, currentDate, { weekStartsOn: 1 });
            const label = formatDateRange(weekStart);

            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectDate(weekStart);
                  onClose();
                }}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose} 
            className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
