import { CalendarX, CheckCircle } from 'lucide-react';

interface ParticipantViewProps {
  weekData: any;
  setWeekData: (data: any) => void;
  currentUser: any;
  onBack: () => void;
  participants: any[];
}

export const ParticipantView = ({ weekData, setWeekData: _setWeekData, currentUser, onBack }: ParticipantViewProps) => {
  const myParts: any[] = [];

  if (!weekData || !currentUser) return <div className="p-10 text-center">Carregando...</div>;

  if (weekData.presidentId === currentUser.id) {
    myParts.push({
      id: 'president',
      title: 'Presidente da Reunião',
      section: 'Reunião Inteira',
      role: 'Titular',
      status: weekData.presidentStatus,
      description: weekData.presidentDescription || 'Presidir a reunião.'
    });
  }

  if (weekData.openingPrayerId === currentUser.id) {
    myParts.push({
      id: 'openingPrayer',
      title: 'Oração Inicial',
      section: 'Abertura',
      role: 'Titular',
      status: weekData.openingPrayerStatus,
      description: weekData.openingPrayerDescription
    });
  }

  weekData.sections.forEach((s: any) => {
    s.parts.forEach((p: any) => {
      if (p.assignedTo === currentUser.id) {
        myParts.push({ ...p, role: 'Titular', section: s.title, partnerId: p.assistantId, partnerLabel: 'Ajudante' });
      }
      if (p.assistantId === currentUser.id) {
        myParts.push({ ...p, role: 'Ajudante', section: s.title, partnerId: p.assignedTo, partnerLabel: 'Titular' });
      }
      if (p.readerId === currentUser.id) {
        myParts.push({ ...p, role: 'Leitor', section: s.title, partnerId: p.assignedTo, partnerLabel: 'Dirigente' });
      }
    });
  });

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'Titular': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'Ajudante': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'Leitor': return 'bg-purple-50 border-purple-100 text-purple-700';
      default: return 'bg-gray-50 border-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 min-h-[600px] relative flex flex-col">
        <div className="bg-blue-600 p-6 text-white pt-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Olá, {currentUser.name.split(' ')[0]}</h2>
              <p className="text-blue-100 text-sm">Designações Pendentes</p>
            </div>
            <button onClick={onBack} className="text-white/80 hover:text-white text-xs">Sair</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {weekData.isCanceled ? (
            <div className="text-center py-10 text-gray-500">
              <CalendarX className="mx-auto mb-2 text-red-400" size={48} />
              <p className="font-bold text-gray-700">Sem Reunião</p>
              <p className="text-sm">Esta semana não haverá reunião.</p>
            </div>
          ) : myParts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
              <p>Tudo limpo! Nenhuma designação pendente.</p>
            </div>
          ) : (
            myParts.map((part: any, idx: number) => (
              <div key={idx} className={`rounded-xl border-l-4 p-4 shadow-sm bg-white ${getRoleStyles(part.role).replace('bg-', 'border-l-')}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleStyles(part.role)}`}>
                      {part.role}
                    </span>
                    <h3 className="font-bold text-gray-800 mt-1">{part.title}</h3>
                    <p className="text-xs text-gray-400">{part.section} • {part.time || '5min'}</p>
                  </div>
                </div>

                {part.description && (
                  <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 mb-2 italic border border-gray-100">
                    "{part.description}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
