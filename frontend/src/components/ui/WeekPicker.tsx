import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WeekPickerProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const WeekPicker = ({ currentDate, onSelectDate, isOpen, onClose }: WeekPickerProps) => {
  const [viewDate, setViewDate] = useState(currentDate);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: startDate,
      end: endDate
    });
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

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
            <div key={i} className="text-center text-xs font-bold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, viewDate);
            const isSelected = isSameDay(day, currentDate);
            const isDayToday = isToday(day);

            // Calculate if this day is part of the selected week?
            // Usually we just highlight the specific day or maybe the whole week?
            // Let's just highlight the day for now, simple picker.
            
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectDate(day);
                  onClose();
                }}
                className={`
                  h-9 w-9 text-sm rounded-full flex items-center justify-center transition-colors
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-blue-50'}
                  ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${isDayToday && !isSelected ? 'border border-blue-600 text-blue-600 font-bold' : ''}
                `}
              >
                {format(day, 'd')}
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
