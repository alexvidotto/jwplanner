import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, MessageCircle, Smartphone, Copy, Check } from 'lucide-react';
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

  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        section: 'Geral',
        observation: ''
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
        section: 'Geral',
        observation: ''
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
              section: section.title,
              observation: part.observation
            });
          }
          if (part.assistantId) {
            all.push({
              id: `${part.id}-ass`,
              role: 'AJUDANTE',
              partTitle: part.title, // Or "Ajudante em..."
              assigneeId: part.assistantId,
              status: part.assistantStatus || 'PENDENTE',
              section: section.title,
              observation: part.observation // Assistant shares observation? Usually yes for main part
            });
          }
          if (part.readerId) {
            all.push({
              id: `${part.id}-read`,
              role: 'LEITOR',
              partTitle: part.title,
              assigneeId: part.readerId,
              status: part.readerStatus || 'PENDENTE',
              section: section.title,
              observation: part.observation
            });
          }
        });
      });
    }

    return all;
  }, [weekData]);

  // Determine what to show. The user image implies showing all but highlighting Pending.
  // We'll show all assignments.
  const filteredAssignments = assignments;

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'PENDENTE').length,
    confirmed: assignments.filter(a => a.status === 'CONFIRMADO').length
  };

  const getMessageText = (assignment: any) => {
    const name = getParticipantName(assignment.assigneeId);
    const date = weekData.dateLabel || 'esta semana';
    let message = `Olá ${name}, tudo bem? Lembrete de sua designação (${assignment.partTitle}) para a semana de ${date}.`;

    if (assignment.observation) {
      message += `\nObs: ${assignment.observation}`;
    }

    message += `\nPor favor, confirme se poderá realizar.`;
    return message;
  };

  const generateWhatsAppLink = (assignment: any) => {
    const phone = getParticipantPhone(assignment.assigneeId);
    if (!phone) return null;

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if phone has country code. Assuming BR (55) if length is 10 or 11.
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const message = getMessageText(assignment);

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyMessage = async (assignment: any) => {
    const message = getMessageText(assignment);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(assignment.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
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
    <div className="bg-gray-100 min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-[#0f172a] text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between relative">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-400 hover:text-white hover:bg-white/10">
            <ArrowLeft size={20} />
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Semana</span>
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigateWeek(-1)} className="text-gray-500 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-white whitespace-nowrap">{weekData.dateLabel}</span>
              <button onClick={() => onNavigateWeek(1)} className="text-gray-500 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
      </header>

      <div className="max-w-md w-full mx-auto p-4 space-y-4">
        {/* SUMMARY BANNER */}
        <div className="bg-[#1e293b] rounded-lg p-4 flex items-center gap-3 shadow-sm select-none">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-[#1e293b] font-bold text-sm">
            {stats.pending}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm">Pendentes</span>
            <span className="text-xs text-gray-400">Aguardando confirmação</span>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {sections.map((sectionTitle) => {
            // Filter out confirmed if we want to mimic "Pendentes" view? 
            // The image implies a list of items. Some appear confirmed (green dot).
            // So we show ALL, but style them differently.
            const sectionAssignments = filteredAssignments.filter(a => a.section === sectionTitle);

            if (sectionAssignments.length === 0) return null;

            return (
              <div key={sectionTitle}>
                {/* <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">{sectionTitle}</h3> */}
                <div className="space-y-3">
                  {sectionAssignments.map(a => {
                    const phone = getParticipantPhone(a.assigneeId);
                    const waLink = generateWhatsAppLink(a);
                    const isConfirmed = a.status === 'CONFIRMADO';
                    const isPending = a.status === 'PENDENTE';

                    // Colors based on status
                    const stripColor = isConfirmed ? 'border-green-500' : (isPending ? 'border-yellow-500' : 'border-red-500');

                    return (
                      <div key={a.id} className={`bg-white rounded-lg shadow-sm border-l-[4px] ${stripColor} p-4 flex items-center justify-between`}>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm truncate">
                              {getParticipantName(a.assigneeId)}
                            </span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                              {a.role === 'TITULAR' ? 'Titular' : a.role}
                            </span>
                          </div>

                          <span className="text-xs text-gray-500 truncate">{a.partTitle}</span>
                          {a.observation && (
                            <span className="text-xs text-gray-400 italic truncate mt-0.5 block">Obs: {a.observation}</span>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            {/* <div className="w-3 h-4 border border-gray-300 rounded-[2px]" /> */}
                            <Smartphone size={12} className="text-gray-400" />
                            <span>{phone || 'Sem telefone'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pl-3 flex-shrink-0">
                          {/* Status Dot */}
                          <StatusEditMenu
                            status={a.status}
                            onChange={(newStatus) => onStatusChange(a.id, newStatus)}
                            variant="circle"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyMessage(a)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Copiar mensagem"
                            >
                              {copiedId === a.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>

                            {waLink ? (
                              <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                                <MessageCircle size={16} className="-ml-0.5 -mt-0.5 fill-current" />
                              </a>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                                <MessageCircle size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
