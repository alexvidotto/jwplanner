import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminMonthViewProps {
  weeks: any[];
  onBack: () => void;
  participants: any[]; // Replace with correct type
}

export const AdminMonthView = ({ weeks, onBack, participants }: AdminMonthViewProps) => {
  const handlePrint = () => { window.print(); };
  const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || '---';

  return (
    <div className="bg-gray-50 min-h-screen pb-20 print:bg-white print:pb-0">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
            <h1 className="font-bold text-gray-800 text-lg">Visão do Mês</h1>
          </div>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-8 print:p-0 print:space-y-6 print:w-full">
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Programação de Reuniões</h1>
          <p className="text-gray-500 text-sm">Congregação Exemplo • Dezembro 2023</p>
        </div>

        {weeks.map((week) => (
          <div key={week.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid print:shadow-none print:border-gray-300 print:rounded-none">
            <div className="bg-gray-100 p-3 border-b border-gray-200 flex justify-between items-center print:bg-gray-50 print:border-gray-300">
              <span className="font-bold text-lg text-gray-800">{week.dateLabel}</span>
              {week.isCanceled && <span className="text-red-600 font-bold text-sm uppercase px-2 border border-red-200 bg-red-50 rounded">Sem Reunião</span>}
            </div>

            {!week.isCanceled && (
              <div className="p-4 grid gap-6 print:p-2 print:gap-4">
                <div className="flex flex-wrap gap-4 text-sm border-b border-gray-100 pb-4 print:pb-2 print:border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">Presidente:</span>
                    <span className="text-gray-900">{getParticipantName(week.presidentId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">Oração Inicial:</span>
                    <span className="text-gray-900">{getParticipantName(week.openingPrayerId)}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-700 text-xs uppercase border-b border-gray-200 pb-1 mb-2">Tesouros</h4>
                    {week.sections.find((s: any) => s.id === 'tesouros').parts.map((part: any) => (
                      <div key={part.id} className="text-sm">
                        <div className="font-medium text-gray-900">{part.title}</div>
                        <div className="text-gray-600 text-xs">{getParticipantName(part.assignedTo)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-yellow-700 text-xs uppercase border-b border-gray-200 pb-1 mb-2">Faça Seu Melhor</h4>
                    {week.sections.find((s: any) => s.id === 'fsm').parts.map((part: any) => (
                      <div key={part.id} className="text-sm mb-2">
                        <div className="font-medium text-gray-900">{part.title}</div>
                        <div className="text-gray-600 text-xs flex flex-col">
                          <span>{getParticipantName(part.assignedTo)}</span>
                          {part.assistantId && <span className="text-gray-400 italic">Aj: {getParticipantName(part.assistantId)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-red-700 text-xs uppercase border-b border-gray-200 pb-1 mb-2">Vida Cristã</h4>
                    {week.sections.find((s: any) => s.id === 'nvc').parts.map((part: any) => (
                      <div key={part.id} className="text-sm mb-2">
                        <div className="font-medium text-gray-900">{part.title}</div>
                        <div className="text-gray-600 text-xs flex flex-col">
                          <span>{getParticipantName(part.assignedTo)}</span>
                          {part.readerId && <span className="text-gray-400 italic">Leitor: {getParticipantName(part.readerId)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
