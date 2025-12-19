
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Printer, Filter } from 'lucide-react';
import { useWeeks, useUpdateWeek } from '../../hooks/useWeeks';
import { useParticipants } from '../../hooks/useParticipants';
import { transformWeeksToFrontend } from '../../lib/transformers';
import { WeekPrintCard } from './WeekPrintCard';

interface MonthViewProps {
  onBack: () => void;
}

export const MonthView = ({ onBack }: MonthViewProps) => {
  const { data: weeksData, isLoading } = useWeeks();
  const { mutateAsync: updateWeek } = useUpdateWeek(); // Need this hook
  const { data: participants } = useParticipants();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]); // 0-indexed

  // Transform data
  const transformedWeeks = useMemo(() => {
    if (!weeksData) return [];
    
    // Use the existing transformer
    const weeks = transformWeeksToFrontend(weeksData);

    // Initial enrichment with names (since transformer only gives IDs)
    // We need to map IDs to Names for print view
    return weeks.map(w => {
        const getParticipantName = (id: string | null) => {
             if (!id) return null;
             return participants?.find(p => p.id === id)?.nome || '---';
        };

        const enrichPart = (part: any) => ({
            ...part,
            assignedToName: getParticipantName(part.assignedTo),
          assistantName: getParticipantName(part.assistantId),
          readerName: getParticipantName(part.readerId)
        });

        const enrichedSections = w.sections.map((section: any) => ({
            ...section,
            parts: section.parts.map(enrichPart)
        }));

        return {
            ...w,
            presidentName: getParticipantName(w.presidentId),
            openingPrayerName: getParticipantName(w.openingPrayerId),
            sections: enrichedSections
        };
    });
  }, [weeksData, participants]);

  // Filter Logic
  const filteredWeeks = useMemo(() => {
    if (!transformedWeeks) return [];
    
    return transformedWeeks.filter(w => {
        const d = new Date(w.date);
        return d.getFullYear() === selectedYear && selectedMonths.includes(d.getMonth());
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transformedWeeks, selectedYear, selectedMonths]);

  const toggleMonth = (monthIndex: number) => {
    if (selectedMonths.includes(monthIndex)) {
        if (selectedMonths.length > 1) { // Prevent deselecting the only month
            setSelectedMonths(selectedMonths.filter(m => m !== monthIndex));
        }
    } else {
        if (selectedMonths.length < 2) {
            setSelectedMonths([...selectedMonths, monthIndex].sort());
        } else {
            // If already 2, replace the last one? Or just don't add. 
            // Better UX: limit to 2.
            // Let's create a specialized UI for this.
        }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const monthsList = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header - No Print */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between print:hidden sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Visão do Mês</h1>
        </div>
        <div className="flex items-center gap-3">
             <button 
               onClick={handlePrint}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
               <Printer size={18} />
               <span>Imprimir</span>
             </button>
        </div>
      </div>

      {/* Filters - No Print */}
      <div className="bg-white px-6 py-4 border-b print:hidden">
         <div className="max-w-4xl mx-auto flex items-center gap-4 flex-wrap">
             <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                <Filter size={16} />
                <span className="text-sm font-medium">Filtros:</span>
             </div>
             
             <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
             >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
             </select>

             <div className="flex bg-gray-100 rounded-lg p-1 gap-1 overflow-x-auto max-w-full">
                 {monthsList.map((m, idx) => (
                    <button
                        key={m}
                        onClick={() => toggleMonth(idx)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            selectedMonths.includes(idx) 
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {m.slice(0, 3)}
                    </button>
                 ))}
             </div>
             <span className="text-xs text-gray-400 ml-auto">Selecione até 2 meses</span>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 print:p-0">
        <div className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:w-full print:max-w-none">
           {isLoading && <div className="text-center py-10 text-gray-400">Carregando...</div>}
           
           {!isLoading && filteredWeeks.length === 0 && (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                   <p className="text-gray-400">Nenhuma semana encontrada para o período selecionado.</p>
               </div>
           )}

           {filteredWeeks.map(week => (
             <WeekPrintCard
               key={week.id}
               week={week}
               onUpdateDescription={async (newDesc) => {
                 await updateWeek({
                   id: week.id,
                   data: { descricao: newDesc }
                 });
               }}
             />
           ))}
        </div>
      </div>

      <style>{`
        @media print {
            @page { margin: 1.5cm; }
            body { background: white; -webkit-print-color-adjust: exact; }
            /* Hide everything else not inside the content div if needed, usually print:hidden handles it */
        }
      `}</style>
    </div>
  );
};
