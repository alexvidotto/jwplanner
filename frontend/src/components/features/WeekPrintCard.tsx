
import React from 'react';

interface WeekPrintCardProps {
  week: any;
  onUpdateDescription?: (newDescription: string) => void;
}

export const WeekPrintCard = ({ week, onUpdateDescription }: WeekPrintCardProps) => {
  const sections = week.sections || [];
  const tesouros = sections.find((s: any) => s.id === 'tesouros');
  const fsm = sections.find((s: any) => s.id === 'fsm');
  const nvc = sections.find((s: any) => s.id === 'nvc');

  // Helper to detect if description is just a default date string
  const isDateDescription = (desc: string) => {
    if (!desc) return false;
    // Matches "12-18 de January" or "12 de Jan - 15 de Feb" patterns approximately
    return /\d+.*de.*/i.test(desc);
  };

  const initialDescription = (!week.description || isDateDescription(week.description))
    ? 'Assembleia'
    : week.description;

  const [description, setDescription] = React.useState(initialDescription);

  // Update local state if prop changes (and we haven't touched it? actually strictly sync for now)
  // But strictly syncing might overwrite user typing if SWR revalidates. 
  // Given the simple usage, just initializing is safer.

  const handleBlur = () => {
    // Save if changed from what IS in the DB (even if we changed it from date->Assembleia effectively)
    // If DB has date string, and we have Assembleia, we SHOULD save.
    if (description !== week.description && onUpdateDescription) {
      onUpdateDescription(description);
    }
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden break-inside-avoid shadow-sm print:shadow-none print:border-gray-300 mb-4 print:mb-2 print:border">
      <div className="bg-gray-50 px-4 py-2 print:px-2 print:py-1 border-b flex justify-between items-center print:bg-gray-100">
        <h3 className="font-bold text-gray-800 text-lg print:text-sm uppercase tracking-wide">
          {week.dateLabel}
        </h3>
      </div>

      {week.isCanceled ? (
        <div className="p-8 text-center text-gray-500 font-medium italic flex flex-col items-center justify-center gap-2">
          <span>Não haverá reunião</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleBlur}
            placeholder="Motivo (ex: Congresso, Assembleia, Celebração, etc.)"
            className="w-full max-w-sm text-center bg-transparent border-none focus:ring-0 text-gray-600 placeholder-gray-300 p-0 resize-none overflow-hidden"
            rows={1}
            style={{ minHeight: '1.5em' }}
          />
        </div>
      ) : (
        <>
          {/* Header Info (President, Prayer) */}
          <div className="px-4 py-2 print:px-2 print:py-1 border-b text-sm print:text-xs flex gap-6 print:gap-4 text-gray-700">
            <div>
              <span className="font-bold text-gray-500 mr-2 uppercase text-xs print:text-[10px]">Presidente:</span>
              <span className="font-bold text-gray-900">{week.presidentName || '---'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-500 mr-2 uppercase text-xs print:text-[10px]">Oração Inicial:</span>
              <span className="font-bold text-gray-900">{week.openingPrayerName || '---'}</span>
            </div>
          </div>

          <div className="p-4 print:p-2 grid grid-cols-3 gap-6 print:gap-2 text-sm print:text-xs">
            {/* Tesouros */}
            <div className="space-y-3 print:space-y-1">
              <h4 className="font-bold text-gray-500 text-xs print:text-[10px] uppercase tracking-wider mb-2 print:mb-1">Tesouros</h4>
              {tesouros?.parts?.map((part: any, idx: number) => {
                const partNumber = idx + 1; // 1-based for Tesouros
                return (
                  <div key={idx} className="mb-2 print:mb-1">
                    <div className="font-medium text-gray-600 leading-tight mb-0.5">{partNumber}. {part.title}</div>
                    <div className="font-bold text-gray-900 text-xs print:text-[10px]">{part.assignedToName || '---'}</div>
                  </div>
                )
              })}
              {(!tesouros?.parts || tesouros.parts.length === 0) && <div className="text-gray-400 italic">Sem partes</div>}
            </div>

            {/* FSM */}
            <div className="space-y-3 print:space-y-1">
              <h4 className="font-bold text-gray-500 text-xs print:text-[10px] uppercase tracking-wider text-yellow-600 mb-2 print:mb-1">Faça Seu Melhor</h4>
              {fsm?.parts?.map((part: any, idx: number) => {
                const startNumber = (tesouros?.parts?.length || 0) + 1;
                const partNumber = startNumber + idx;

                return (
                  <div key={idx} className="mb-2 print:mb-1">
                    <div className="font-medium text-gray-600 leading-tight mb-0.5">{partNumber}. {part.title}</div>
                    <div className="font-bold text-gray-900 text-xs print:text-[10px]">{part.assignedToName || '---'}</div>
                    {part.assistantName && <div className="text-gray-600 text-[10px] print:text-[9px]">Aj: <span className="font-bold text-gray-900">{part.assistantName}</span></div>}
                  </div>
                )
              })}
              {(!fsm?.parts || fsm.parts.length === 0) && <div className="text-gray-400 italic">Sem partes</div>}
            </div>

            {/* NVC */}
            <div className="space-y-3 print:space-y-1">
              <h4 className="font-bold text-gray-500 text-xs print:text-[10px] uppercase tracking-wider text-red-600 mb-2 print:mb-1">Vida Cristã</h4>
              {nvc?.parts?.map((part: any, idx: number) => {
                const isFinalPrayer = part.title === 'Oração Final';
                let partNumberDisplay = '';

                if (!isFinalPrayer) {
                  const tesourosCount = tesouros?.parts?.length || 0;
                  const fsmCount = fsm?.parts?.length || 0;
                  // Calculate previous parts in this section that were NOT final prayer (though typically final prayer is last)
                  // To be safe, we should count all previous parts across sections + previous parts in this section.
                  // But typically NVC has just regular parts + song + prayer.
                  // Songs are not usually in "parts" array here unless modeled.
                  // Assuming simple sequential index for now, but skipping number for Final Prayer.
                  const startNumber = tesourosCount + fsmCount + 1;
                  const partNumber = startNumber + idx;
                  partNumberDisplay = `${partNumber}. `;
                }

                return (
                  <div key={idx} className="mb-2 print:mb-1">
                    <div className="font-medium text-gray-600 leading-tight mb-0.5">{partNumberDisplay}{part.title}</div>
                    <div className="font-bold text-gray-900 text-xs print:text-[10px]">{part.assignedToName || '---'}</div>
                    {part.requiresReader && <div className="text-gray-600 text-[10px] print:text-[9px]">Leitor: <span className="font-bold text-gray-900">{part.readerName || '---'}</span></div>}
                  </div>
                )
              })}
              {(!nvc?.parts || nvc.parts.length === 0) && <div className="text-gray-400 italic">Sem partes</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


