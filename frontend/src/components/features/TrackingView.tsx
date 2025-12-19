import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, MessageCircle, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusEditMenu } from '../ui/StatusEditMenu';

interface TrackingViewProps {
  weekData: any;
  participants: any[];
  onBack: () => void;
  onNavigateWeek: (direction: number) => void;
  onJumpToCurrentWeek: () => void;
  onStatusChange: (assignmentId: string, newStatus: string) => void;
}

export const TrackingView = ({ weekData, participants, onBack, onNavigateWeek, onJumpToCurrentWeek, onStatusChange }: TrackingViewProps) => {

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');

  // Helper to find participant phone
  const getParticipantPhone = (id: string) => {
    if (!participants) return undefined;
    const p = participants.find(part => part.id === id);
    return p?.phone || p?.telefone; // Handle schema variations
  };

  const getParticipantName = (id: string) => {
    if (!participants) return 'Desconhecido';
    const p = participants.find(part => part.id === id);
    return p?.name || p?.nome || 'Desconhecido';
  };

  // Flatten assignments
  // Flatten assignments
  const assignments = useMemo(() => {

    if (!weekData || weekData.isCanceled) return [];

    const all: any[] = [];

    // President
    if (weekData.presidentId) {
      all.push({
        id: 'president',
        role: 'PRESIDENTE',
        partTitle: 'Presidente',
        assigneeId: weekData.presidentId,
        status: weekData.presidentStatus || 'PENDENTE',
        section: 'Geral'
      });
    }

    // Opening Prayer
    if (weekData.openingPrayerId) {
      all.push({
        id: 'openingPrayer',
        role: 'ORAÇÃO',
        partTitle: 'Oração Inicial',
        assigneeId: weekData.openingPrayerId,
        status: weekData.openingPrayerStatus || 'PENDENTE',
        section: 'Geral'
      });
    }

    if (weekData.sections) {
      weekData.sections.forEach((section: any) => {
        section.parts.forEach((part: any) => {
          if (part.assignedTo) {
            all.push({
              id: part.id,
              role: 'TITULAR',
              partTitle: part.title,
              assigneeId: part.assignedTo,
              status: part.status || 'PENDENTE',
              section: section.title
            });
          }
          if (part.assistantId) {
            all.push({
              id: `${part.id}-ass`,
              role: 'AJUDANTE',
              partTitle: part.title, // Or "Ajudante em..."
              assigneeId: part.assistantId,
              status: part.assistantStatus || 'PENDENTE',
              section: section.title
            });
          }
          if (part.readerId) {
            all.push({
              id: `${part.id}-read`,
              role: 'LEITOR',
              partTitle: part.title,
              assigneeId: part.readerId,
              status: part.readerStatus || 'PENDENTE',
              section: section.title
            });
          }
        });
      });
    }

    return all;
  }, [weekData]);

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'PENDING') return a.status === 'PENDENTE';
    if (filter === 'CONFIRMED') return a.status === 'CONFIRMADO';
    return true;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'PENDENTE').length,
    confirmed: assignments.filter(a => a.status === 'CONFIRMADO').length
  };

  const generateWhatsAppLink = (assignment: any) => {
    const phone = getParticipantPhone(assignment.assigneeId);
    if (!phone) return null;

    const name = getParticipantName(assignment.assigneeId);
    const date = weekData.dateLabel || 'esta semana';
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if phone has country code. Assuming BR (55) if length is 10 or 11.
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const message = `Olá ${name}, tudo bem? Lembrete de sua designação (${assignment.partTitle}) para a semana de ${date}. Por favor, confirme se poderá realizar.`;

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  };

  // Extract unique sections from assignments to ensure everything is rendered
  const sections = useMemo(() => {
    // We want a specific order if possible, but for now let's just use what's there or sort?
    // Let's use the order they appear in assignments + 'Geral' first.
    const unique = Array.from(new Set(assignments.map(a => a.section)));
    // Sort: Geral first, then others.
    return unique.sort((a, b) => {
      if (a === 'Geral') return -1;
      if (b === 'Geral') return 1;
      return 0;
    });
  }, [assignments]);

  return (
    <div className="bg-gray-900 min-h-screen pb-20 text-gray-100 flex flex-col items-center">
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-sm w-full">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center gap-3 z-10">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-400 hover:text-white hover:bg-gray-700"><ArrowLeft size={20} /></Button>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 w-max">
            <button onClick={() => onNavigateWeek(-1)} className="p-2 hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="font-bold text-gray-100 text-lg leading-tight">
                Acompanhamento
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">{weekData.dateLabel}</p>
            </div>
            <button onClick={() => onNavigateWeek(1)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 z-10">
            <Button size="sm" variant="ghost" onClick={onJumpToCurrentWeek} className="flex text-gray-400 hover:bg-gray-700 hover:text-white" title="Voltar para semana atual">
              <Calendar size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-md w-full p-4 space-y-6">
        {/* SUMMARY CARD */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setFilter('ALL')} className={`p-3 rounded-xl border transition-all ${filter === 'ALL' ? 'bg-blue-900/30 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total</div>
            <div className="text-xl font-black text-blue-400">{stats.total}</div>
          </button>
          <button onClick={() => setFilter('PENDING')} className={`p-3 rounded-xl border transition-all ${filter === 'PENDING' ? 'bg-yellow-900/30 border-yellow-500/50 ring-1 ring-yellow-500/30' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}>
            <div className="text-[10px] text-yellow-600 uppercase font-bold tracking-wider mb-1">Pendentes</div>
            <div className="text-xl font-black text-yellow-500">{stats.pending}</div>
          </button>
          <button onClick={() => setFilter('CONFIRMED')} className={`p-3 rounded-xl border transition-all ${filter === 'CONFIRMED' ? 'bg-green-900/30 border-green-500/50 ring-1 ring-green-500/30' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}>
            <div className="text-[10px] text-green-600 uppercase font-bold tracking-wider mb-1">Confirmados</div>
            <div className="text-xl font-black text-green-500">{stats.confirmed}</div>
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-6">
          {sections.map((sectionTitle) => {
            const sectionAssignments = filteredAssignments.filter(a => a.section === sectionTitle);

            if (sectionAssignments.length === 0) return null;

            return (
              <div key={sectionTitle}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">{sectionTitle}</h3>
                <div className="space-y-3">
                  {sectionAssignments.map(a => {
                    const phone = getParticipantPhone(a.assigneeId);
                    const waLink = generateWhatsAppLink(a);

                    return (
                      <div key={a.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-between shadow-sm hover:border-gray-600 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg 
                                  ${a.status === 'CONFIRMADO' ? 'bg-green-900/50 text-green-400' :
                              a.status === 'PENDENTE' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                            {getParticipantName(a.assigneeId).charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-200 truncate">{getParticipantName(a.assigneeId)}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0
                                        ${a.role === 'TITULAR' ? 'bg-blue-900/30 text-blue-300' :
                                  a.role === 'AJUDANTE' ? 'bg-green-900/30 text-green-300' :
                                    a.role === 'LEITOR' ? 'bg-purple-900/30 text-purple-300' : 'bg-gray-700 text-gray-400'}`}>
                                {a.role}
                              </span>
                              <span className="truncate">{a.partTitle}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pl-2 flex-shrink-0">
                          {/* Status Menu */}
                          <StatusEditMenu
                            status={a.status}
                            onChange={(newStatus) => onStatusChange(a.id, newStatus)}
                            variant="badge"
                          />

                          {waLink ? (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-green-900/20 text-green-400 hover:bg-green-600 hover:text-white transition-colors border border-green-900/30" title="Enviar mensagem no WhatsApp">
                              <MessageCircle size={20} />
                            </a>
                          ) : (
                            <div className="p-2 rounded-full bg-gray-700 text-gray-500 cursor-not-allowed" title="Sem telefone cadastrado">
                              <MessageCircle size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p>Nenhuma designação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};
