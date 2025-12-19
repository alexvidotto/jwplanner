
import React from 'react';

interface WeekPrintCardProps {
  week: any;
}

export const WeekPrintCard = ({ week }: WeekPrintCardProps) => {
  const sections = week.sections || [];
  const tesouros = sections.find((s: any) => s.id === 'tesouros');
  const fsm = sections.find((s: any) => s.id === 'fsm');
  const nvc = sections.find((s: any) => s.id === 'nvc');

  return (
    <div className="bg-white border rounded-lg overflow-hidden break-inside-avoid shadow-sm print:shadow-none print:border-gray-300 mb-4">
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center print:bg-gray-100">
        <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wide">
          {week.dateLabel}
        </h3>
      </div>

      {/* Header Info (President, Prayer) */}
      <div className="px-4 py-2 border-b text-sm flex gap-6 text-gray-700">
        <div>
          <span className="font-bold text-gray-500 mr-2 uppercase text-xs">Presidente:</span>
          <span className="font-medium">{week.presidentName || '---'}</span>
        </div>
        <div>
          <span className="font-bold text-gray-500 mr-2 uppercase text-xs">Oração Inicial:</span>
          <span className="font-medium">{week.openingPrayerName || '---'}</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-6 text-sm">
        {/* Tesouros */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Tesouros</h4>
          {tesouros?.parts?.map((part: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="font-semibold text-gray-800 leading-tight">{part.title}</div>
              <div className="text-gray-600 text-xs">{part.assignedToName || '---'}</div>
            </div>
          ))}
          {(!tesouros?.parts || tesouros.parts.length === 0) && <div className="text-gray-400 italic">Sem partes</div>}
        </div>

        {/* FSM */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider text-yellow-600 mb-2">Faça Seu Melhor</h4>
          {fsm?.parts?.map((part: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="font-semibold text-gray-800 leading-tight">{part.title}</div>
              <div className="text-gray-600 text-xs">{part.assignedToName || '---'}</div>
              {part.assistantName && <div className="text-gray-400 text-[10px] italic">Aj: {part.assistantName}</div>}
            </div>
          ))}
          {(!fsm?.parts || fsm.parts.length === 0) && <div className="text-gray-400 italic">Sem partes</div>}
        </div>

        {/* NVC */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider text-red-600 mb-2">Vida Cristã</h4>
          {nvc?.parts?.map((part: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="font-semibold text-gray-800 leading-tight">{part.title}</div>
              <div className="text-gray-600 text-xs">{part.assignedToName || '---'}</div>
              {part.requiresReader && <div className="text-gray-400 text-[10px] italic">Leitor: {part.assistantName || '---'}</div>}
            </div>
          ))}
          {(!nvc?.parts || nvc.parts.length === 0) && <div className="text-gray-400 italic">Sem partes</div>}
        </div>
      </div>
    </div>
  );
};
