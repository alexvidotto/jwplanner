import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Smartphone, Copy, Check, Link as LinkIcon, Calendar } from 'lucide-react';
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

export const TrackingView = ({ weekData, participants, onBack, onNavigateWeek, onStatusChange }: TrackingViewProps) => {

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [expandedObsIds, setExpandedObsIds] = useState<Set<string>>(new Set());

  const toggleObs = (id: string) => {
    setExpandedObsIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
  const assignments = useMemo(() => {

    if (!weekData || weekData.isCanceled) return [];

    const all: any[] = [];

    // President
    if (weekData.presidentId) {
      all.push({
        id: `week-${weekData.id}-president`,
        realId: `week-${weekData.id}-president`,
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
      const prayerId = weekData.openingPrayerPartId || `week-${weekData.id}-prayer`;
      all.push({
        id: prayerId,
        realId: prayerId,
        role: 'ORAÇÃO',
        partTitle: 'Oração Inicial',
        assigneeId: weekData.openingPrayerId,
        status: weekData.openingPrayerStatus || 'PENDENTE',
        section: 'Geral',
        observation: ''
      });
    }

    // Sections
    let globalPartCounter = 0;
    const processSection = (sectionId: string, sectionTitle: string) => {
      const section = weekData.sections?.find((s: any) => s.id === sectionId);
      if (section) {
        section.parts?.forEach((part: any) => {
          const isFinalPrayer = part.title === 'Oração Final';
          let partNum = undefined;
          if (!isFinalPrayer && sectionId !== 'geral') { // Adjust logic if needed
            globalPartCounter++;
            partNum = globalPartCounter;
          }

          if (part.assignedTo) {
            all.push({
              id: part.id,
              realId: part.id,
              role: 'TITULAR',
              partTitle: part.title,
              assigneeId: part.assignedTo,
              status: part.status || 'PENDENTE',
              section: section.title || sectionTitle,
              observation: part.observation,
              partNumber: partNum,
              token: part.token,
              originalIndex: all.length // Keep track of order
            });
          }
          if (part.assistantId) {
            all.push({
              id: `${part.id}-ass`,
              realId: part.id,
              role: 'AJUDANTE',
              partTitle: part.title,
              assigneeId: part.assistantId,
              status: part.assistantStatus || 'PENDENTE',
              section: section.title || sectionTitle,
              observation: part.observation,
              partNumber: partNum,
              token: part.token,
              originalIndex: all.length
            });
          }
          if (part.readerId) {
            all.push({
              id: `${part.id}-read`,
              realId: part.id,
              role: 'LEITOR',
              partTitle: part.title,
              assigneeId: part.readerId,
              status: part.readerStatus || 'PENDENTE',
              section: section.title || sectionTitle,
              observation: part.observation,
              partNumber: partNum,
              originalIndex: all.length
            });
          }
        });
      }
    };

    // Reset counter for logic if needed, but we used global above
    // Process in order
    processSection('tesouros', 'Tesouros');
    processSection('fsm', 'Faça Seu Melhor');
    processSection('nvc', 'Nossa Vida Cristã');

    return all;
  }, [weekData]);


  const generateAssignmentLink = (assignment: any) => {
    const targetId = assignment.realId || assignment.id;
    if (targetId && targetId.length > 20) {
      let link = `${window.location.origin}/confirm/${targetId}`;
      if (assignment.assigneeId && ['TITULAR', 'AJUDANTE', 'LEITOR', 'PRESIDENTE', 'ORAÇÃO'].includes(assignment.role)) {
        link += `/${assignment.assigneeId}`;
      }
      return link;
    }
    return null;
  };

  const getMessageText = (assignment: any) => {
    // const name = getParticipantName(assignment.assigneeId);
    const date = weekData.dateLabel || 'esta semana';

    let partInfo = assignment.partTitle;
    if (assignment.partNumber) {
      partInfo = `Parte ${assignment.partNumber}: ${partInfo}`;
    }

    let sectionInfo = '';
    if (assignment.section && assignment.section !== 'Geral') {
      // Simplify section name for message if needed
      sectionInfo = ` em ${assignment.section}`;
    }

    let message = `Olá, tudo bem? Lembra-se da designação${sectionInfo} (${partInfo}) para a semana de ${date}?`;

    if (assignment.observation) {
      message += `\nObs: ${assignment.observation}`;
    }

    const link = generateAssignmentLink(assignment);
    if (link) {
      message += `\n\nConfirme aqui:\n${link}`;
    } else {
      message += `\nConfirme se poderá realizar.`;
    }

    return message;
  };

  const generateWhatsAppLink = (assignment: any) => {
    const phone = getParticipantPhone(assignment.assigneeId);
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
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

  const handleCopyLink = async (assignment: any) => {
    const link = generateAssignmentLink(assignment);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(assignment.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  // Grouping Logic
  const pendingAssignments = assignments.filter(a => a.status === 'PENDENTE');
  const refusedAssignments = assignments.filter(a => a.status === 'RECUSADO');
  // const definedAssignments = assignments.filter(a => a.status !== 'PENDENTE');

  const hasRefused = refusedAssignments.length > 0;
  const hasPending = pendingAssignments.length > 0;

  // Helper to render text with markdown links
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a
            key={index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline cursor-pointer relative z-20"
            onClick={(e) => e.stopPropagation()} // Prevent triggering parent clicks
          >
            {match[1]}
          </a>
        );
      }
      return part;
    });
  };

  const renderCard = (a: any) => {
    const phone = getParticipantPhone(a.assigneeId);
    const waLink = generateWhatsAppLink(a);
    const hasLink = generateAssignmentLink(a);

    return (
      <div key={a.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${a.status === 'RECUSADO' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
        }`}>
        {/* Header: Name + Status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide min-w-[28px] text-center ${a.role === 'TITULAR' ? 'bg-blue-100 text-blue-700' :
                a.role === 'AJUDANTE' ? 'bg-purple-100 text-purple-700' :
                  a.role === 'LEITOR' ? 'bg-indigo-100 text-indigo-700' :
                  a.role === 'PRESIDENTE' ? 'bg-gray-100 text-gray-700' :
                    a.role === 'ORAÇÃO' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
              }`}>
              {a.role === 'TITULAR' ? 'TI' :
                a.role === 'AJUDANTE' ? 'AJ' :
                  a.role === 'LEITOR' ? 'LE' :
                    a.role === 'PRESIDENTE' ? 'PR' :
                      a.role === 'ORAÇÃO' ? 'OR' :
                        a.role.substring(0, 2).toUpperCase()}
            </span>
            <h3 className="text-gray-900 font-bold text-lg leading-tight truncate">
              {getParticipantName(a.assigneeId)}
            </h3>
          </div>
          <StatusEditMenu
            status={a.status}
            onChange={(newStatus) => onStatusChange(a.id, newStatus)}
            variant="badge"
          />
        </div>

        {/* Content */}
        <div className="mb-4 space-y-1">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-2">
            {a.section}
            {a.partNumber && <span className="text-gray-300">•</span>}
            {a.partNumber && <span>Parte {a.partNumber}</span>}
          </div>
          <p className="text-gray-800 font-medium text-base">
            {a.partTitle}
          </p>
          {a.observation && (
            <div className={`text-sm text-gray-500 bg-gray-50 p-2 rounded-lg mt-2 italic border border-gray-100 relative group cursor-pointer ${expandedObsIds.has(a.id) ? '' : 'truncate'}`} onClick={() => toggleObs(a.id)}>
              {renderTextWithLinks(a.observation)}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
            <Smartphone size={12} />
            <span>{phone || 'Sem telefone'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 pt-3 border-t border-gray-50">
          {hasLink && (
            <Button
              variant="outline"
              className="w-10 px-0 flex items-center justify-center border-gray-200 hover:bg-gray-50 text-gray-500"
              onClick={() => handleCopyLink(a)}
              title="Copiar Link"
            >
              {copiedLinkId === a.id ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} />}
            </Button>
          )}

          <Button
            variant="outline"
            className={`${!hasLink ? 'col-span-1' : ''} flex items-center justify-center gap-2 h-10 border-gray-200 hover:bg-gray-50 text-gray-700`}
            onClick={() => handleCopyMessage(a)}
          >
            {copiedId === a.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            <span className="text-xs font-semibold">Copiar Msg</span>
          </Button>

          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg h-10 transition-colors shadow-sm hover:shadow"
            >
              <MessageCircle size={18} fill="currentColor" className="text-white/90" />
              <span className="text-xs font-bold uppercase tracking-wide">Enviar</span>
            </a>
          ) : (
            <Button disabled className="w-full bg-gray-100 text-gray-400 h-10">
              Sem WhatsApp
            </Button>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-m mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 text-gray-600">
            <ArrowLeft size={20} />
          </Button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-lg leading-none mb-0.5">
              <span>Semana</span>
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-1 p-0.5 mt-1">
              <button
                onClick={() => onNavigateWeek(-1)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all active:scale-95 active:bg-white active:text-gray-900"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="capitalize min-w-[120px] text-center text-xs text-gray-600 font-semibold">{weekData.dateLabel}</span>
              <button
                onClick={() => onNavigateWeek(1)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all active:scale-95 active:bg-white active:text-gray-900"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="w-8"></div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">

        {/* Summary Header */}
        <div className={`rounded-xl p-4 flex items-center justify-between shadow-sm border ${hasRefused
            ? 'bg-red-50 border-red-100 text-red-800'
            : hasPending
              ? 'bg-amber-50 border-amber-100 text-amber-800'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasRefused ? 'bg-red-500 animate-pulse' :
                hasPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`} />
            <span className="font-bold text-sm tracking-wide">
              {hasRefused ? (
                <span>
                  {refusedAssignments.length} {refusedAssignments.length === 1 ? 'Recusado' : 'Recusados'}
                  {hasPending && <span className="mx-1.5 opacity-70">•</span>}
                  {hasPending && `${pendingAssignments.length} ${pendingAssignments.length === 1 ? 'Pendente' : 'Pendentes'}`}
                </span>
              ) : hasPending ? (
                `${pendingAssignments.length} ${pendingAssignments.length === 1 ? 'Pendente' : 'Pendentes'}`
              ) : (
                'Sem pendências'
              )}
            </span>
          </div>
        </div>

        {/* Unified List */}
        <div className="space-y-4">
          {assignments.map(renderCard)}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>Nenhuma designação para esta semana.</p>
          </div>
        )}

      </div>
    </div>
  );
};
