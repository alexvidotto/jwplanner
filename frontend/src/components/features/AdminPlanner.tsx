import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, MoreVertical, CheckCircle, Info, CalendarX, Briefcase, Users, Plus, Trash2, AlertTriangle, Clock, XCircle, Search, Check, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusEditMenu } from '../ui/StatusEditMenu';
import { EditableField } from '../ui/EditableField';
import { EditableDescription } from '../ui/EditableDescription';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Toast } from '../ui/Toast';
import { parseTime, formatTotalTime } from '../../lib/utils';
// Note: Using absolute paths or relative paths as needed. Assuming strict file structure.

interface AdminPlannerProps {
  weekData: any; // Type accurately if possible
  setWeekData: (data: any) => void;
  onBack: () => void;
  onNavigateWeek: (direction: number) => void;
  partTemplates: any[];
  onSave?: (weekData: any) => Promise<void>;
  participants: any[];
}

export const AdminPlanner = ({ weekData, setWeekData, onBack, onNavigateWeek, participants, partTemplates, onSave }: AdminPlannerProps) => {
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAddMenu, setActiveAddMenu] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draggedPart, setDraggedPart] = useState<{ partId: string, sectionId: string } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, data: any }>({ isOpen: false, data: null });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const totalMinutes = weekData.sections.reduce((acc: number, section: any) => {
    return acc + section.parts.reduce((pAcc: number, part: any) => pAcc + parseTime(part.time), 0);
  }, 0);

  const MAX_MINUTES = 105;
  const isOverTime = totalMinutes > MAX_MINUTES;

  const handleDragStart = (e: React.DragEvent, partId: string, sectionId: string) => {
    if (sectionId !== 'fsm' && sectionId !== 'nvc') {
      e.preventDefault();
      return;
    }
    if (partId.includes('n_prayer') || partId.includes('n2-')) {
      e.preventDefault();
      return;
    }
    setDraggedPart({ partId, sectionId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPart(null);
  };

  const handleDrop = (e: React.DragEvent, targetPartId: string, sectionId: string) => {
    e.preventDefault();
    if (!draggedPart || draggedPart.sectionId !== sectionId) return;
    if (draggedPart.partId === targetPartId) return;

    const updatedSections = weekData.sections.map((section: any) => {
      if (section.id !== sectionId) return section;

      const parts = [...section.parts];
      const fromIndex = parts.findIndex(p => p.id === draggedPart.partId);
      const toIndex = parts.findIndex(p => p.id === targetPartId);

      if (fromIndex === -1 || toIndex === -1) return section;

      const [movedPart] = parts.splice(fromIndex, 1);
      parts.splice(toIndex, 0, movedPart);

      if (section.id === 'nvc') {
        const study = parts.find(p => p.id.includes('n2-'));
        const prayer = parts.find(p => p.id.includes('n_prayer'));

        const dynamicParts = parts.filter(p => !p.id.includes('n2-') && !p.id.includes('n_prayer'));

        const reconstructedParts = [...dynamicParts];
        if (study) reconstructedParts.push(study);
        if (prayer) reconstructedParts.push(prayer);

        return { ...section, parts: reconstructedParts };
      }

      return { ...section, parts };
    });

    setWeekData({ ...weekData, sections: updatedSections });
    setDraggedPart(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (onSave) {
      await onSave(weekData);
    } else {
      setTimeout(() => { }, 800); // Fallback
    }
    setIsSaving(false);
    showToast("Alterações salvas com sucesso!");
  };

  const handleToggleWeekCanceled = () => {
    setWeekData({ ...weekData, isCanceled: !weekData.isCanceled });
    setIsMenuOpen(false);
  };

  const handleUpdatePart = (sectionId: string, partId: string, field: string, value: any) => {
    const updatedSections = weekData.sections.map((section: any) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        parts: section.parts.map((p: any) => p.id === partId ? { ...p, [field]: value } : p)
      };
    });
    setWeekData({ ...weekData, sections: updatedSections });
  };

  const handleAssignClick = (part: any, role: string) => {
    setSelectedPart({ ...part, roleTarget: role });
    setIsModalOpen(true);
  };

  const handleSelectParticipant = (participantId: string) => {
    if (selectedPart.id === 'president') {
      const isPrayerEmpty = !weekData.openingPrayerId;
      const isPrayerSameAsPresident = weekData.openingPrayerId === weekData.presidentId;

      setWeekData({
        ...weekData,
        presidentId: participantId,
        presidentStatus: 'PENDENTE',
        openingPrayerId: (isPrayerEmpty || isPrayerSameAsPresident) ? participantId : weekData.openingPrayerId,
        openingPrayerStatus: (isPrayerEmpty || isPrayerSameAsPresident) ? 'PENDENTE' : weekData.openingPrayerStatus
      });
      setIsModalOpen(false);
      return;
    }

    if (selectedPart.id === 'openingPrayer') {
      setWeekData({
        ...weekData,
        openingPrayerId: participantId,
        openingPrayerStatus: 'PENDENTE'
      });
      setIsModalOpen(false);
      return;
    }

    const updatedSections = weekData.sections.map((section: any) => ({
      ...section,
      parts: section.parts.map((p: any) => {
        if (p.id === selectedPart.id) {
          if (selectedPart.roleTarget === 'assistant') return { ...p, assistantId: participantId };
          if (selectedPart.roleTarget === 'reader') return { ...p, readerId: participantId };

          const newPart = { ...p, assignedTo: participantId, status: 'PENDENTE' };

          // Auto-assign logic: If this is President, try to assign Initial Prayer
          if (p.title === 'Presidente') {
            // Find Initial Prayer part in the same section (or globally if needed, but usually same section 'geral')
            // Actually we operate on 'p', but we need to update OTHER parts in the same section.
            // This map is inner, so we need to be careful. 
            // Better strategy: We can't easily update sibling parts inside this map cleanly without side effects or complex logic.
            // We should do it in the outer map or second pass? 
            // Or update the state AFTER this map.
            // Let's keep it simple for now: We return the updated part here.
          }
          return newPart;
        }
        return p;
      })
    }));

    // Post-process for auto-assignment
    if (selectedPart.title === 'Presidente') {
      updatedSections.forEach((section: any) => {
        const presidentPart = section.parts.find((p: any) => p.id === selectedPart.id);
        if (presidentPart) {
          // Found the section with President
          const prayerPart = section.parts.find((p: any) => p.title === 'Oração Inicial');
          if (prayerPart && (!prayerPart.assignedTo || prayerPart.assignedTo === weekData.lastPresidentId)) {
            // Logic: if empty or same as "previous" (which we might not track well here depending on state).
            // Simpler: If empty, assign. If same as OLD participantId (which we don't have easy access to here), assign.
            // Let's just say: If empty, assign to new president.
            prayerPart.assignedTo = participantId;
            prayerPart.status = 'PENDENTE';
          }
        }
      });
    }

    setWeekData({ ...weekData, sections: updatedSections });
    setIsModalOpen(false);
  };

  const handleAddPart = (sectionId: string, template: any) => {
    const newPart = {
      id: `new-${Date.now()}`,
      templateId: template.id,
      title: template.title,
      time: template.defaultTime,
      assignedTo: null,
      status: 'PENDENTE',
      description: '',
      ...(template.requiresAssistant ? { assistantId: null, assistantStatus: 'PENDENTE' } : {}),
      ...(template.requiresReader ? { readerId: null, readerStatus: 'PENDENTE' } : {})
    };

    const updatedSections = weekData.sections.map((section: any) => {
      if (section.id !== sectionId) return section;
      let newParts = [...section.parts];
      if (section.id === 'nvc') {
        const fixedPartIndex = newParts.findIndex((p: any) => p.id.includes('n2-') || p.id.includes('n_prayer'));
        if (fixedPartIndex !== -1) {
          newParts.splice(fixedPartIndex, 0, newPart);
        } else {
          newParts.push(newPart);
        }
      } else {
        newParts.push(newPart);
      }
      return { ...section, parts: newParts };
    });

    setWeekData({ ...weekData, sections: updatedSections });
    setActiveAddMenu(null);
  };

  const handleRequestRemove = (sectionId: string, partId: string) => {
    setConfirmDialog({
      isOpen: true,
      data: { sectionId, partId }
    });
  };

  const executeRemovePart = () => {
    const { sectionId, partId } = confirmDialog.data;
    const updatedSections = weekData.sections.map((section: any) => {
      if (section.id !== sectionId) return section;
      return { ...section, parts: section.parts.filter((p: any) => p.id !== partId) };
    });
    setWeekData({ ...weekData, sections: updatedSections });
    setConfirmDialog({ isOpen: false, data: null });
    showToast("Parte removida.");
  };

  const getSuggestions = () => {
    if (!selectedPart) return [];

    return participants.filter(p => {
      // 0. Filtro de Ativo (Designar: Sim/Não)
      if (p.active === false) return false;

      // 1. Filtro de Ajudante (Gênero)
      if (selectedPart.roleTarget === 'assistant') {
        const mainPart = weekData.sections.flatMap((s: any) => s.parts).find((pt: any) => pt.id === selectedPart.id);
        const mainPerson = participants.find(user => user.id === mainPart?.assignedTo);
        if (mainPerson?.gender === 'PM' && p.gender !== 'PM') return false;
        if (mainPerson?.gender === 'PH' && p.gender !== 'PH') return false;
        return true;
      }

      // 2. Filtro de Habilidade (Vinculado ao Template ID)
      if (selectedPart.templateId) {
        // Se estamos buscando um LEITOR, procuramos a habilidade _reader
        if (selectedPart.roleTarget === 'reader') {
          if (!p.abilities?.includes(`${selectedPart.templateId}_reader`)) return false;
        } else {
          // Se estamos buscando Titular, procuramos a habilidade padrão
          if (!p.abilities?.includes(selectedPart.templateId)) return false;
        }
      }

      // Se for Presidente ou Oração e não tiver templateId explícito, assumimos logica simples (Anciao/Servo/PH)
      if (selectedPart.id === 'president') {
        if (p.type !== 'ANCIAO' && p.type !== 'SERVO') return false;
      }
      if (selectedPart.id === 'openingPrayer') {
        if (p.gender !== 'PH') return false;
      }

      return true;
    });
  };

  const getAvailablePartsForSection = (sectionId: string) => {
    return partTemplates.filter(pt => pt.section === sectionId);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center gap-3 z-10">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 w-max">
            <button onClick={() => onNavigateWeek(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="font-bold text-gray-800 text-lg leading-tight">Planejamento</h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">{weekData.dateLabel}</p>
            </div>
            <button onClick={() => onNavigateWeek(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 z-10">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={isSaving} className="hidden sm:flex">
              {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar</>}
            </Button>

            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:bg-gray-100">
                <MoreVertical size={20} />
              </Button>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-30">
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3" onClick={handleToggleWeekCanceled}>
                    <div className={`mt-0.5 w-5 h-5 border-2 rounded flex items-center justify-center ${weekData.isCanceled ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                      {weekData.isCanceled && <CheckCircle size={14} className="fill-white text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">Não haverá reunião</span>
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 hover:text-blue-500" />
                          <div className="absolute right-0 top-6 w-56 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-40 shadow-lg">
                            Utilize esta opção quando eventos especiais cancelam a reunião do meio de semana.
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-tight">Desativa a grade e notifica participantes.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {weekData.isCanceled ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-100 transition-opacity">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <CalendarX size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700">Semana sem Reunião</h2>
            <p className="text-gray-500 max-w-md">Programação suspensa. Não haverá reunião nesta semana devido a eventos especiais.</p>
            <Button variant="outline" onClick={handleToggleWeekCanceled} className="mt-4">Reativar Semana</Button>
          </div>
        ) : (
          <>
              {/* PRESIDENT CARD */}
              <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-800">Presidente da Reunião</h2>

                <div className="flex flex-col gap-3 w-full sm:w-auto items-end">
                  {/* President Assignee */}
                  <div className="w-full sm:w-[280px]">
                    {weekData.presidentId ? (
                      <div onClick={() => handleAssignClick({ id: 'president', title: 'Presidente' }, 'main')} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-400 cursor-pointer transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                            {participants.find(p => p.id === weekData.presidentId)?.name.charAt(0)}
                          </div>
                          <span className="text-gray-700 font-medium truncate">
                            {participants.find(p => p.id === weekData.presidentId)?.name}
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <StatusEditMenu
                            variant="circle"
                            status={weekData.presidentStatus}
                            onChange={(s) => setWeekData({ ...weekData, presidentStatus: s })}
                          />
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => handleAssignClick({ id: 'president', title: 'Presidente' }, 'main')} className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded p-2 hover:bg-blue-50 transition-colors">
                        + Designar Presidente
                      </button>
                    )}
                  </div>

                  {/* Opening Prayer */}
                  <div className="w-full sm:w-[280px] bg-gray-50 rounded px-3 py-2 flex items-center justify-between border border-transparent hover:border-gray-200 transition-colors">
                    {weekData.openingPrayerId ? (
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Oração Inicial:</span>
                        <button onClick={() => handleAssignClick({ id: 'openingPrayer', title: 'Oração Inicial' }, 'main')} className="text-gray-700 font-medium text-sm hover:text-blue-600 truncate flex-1 text-right">
                          {participants.find(p => p.id === weekData.openingPrayerId)?.name}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between">
                        <span className="text-gray-400 text-sm font-medium">Oração Inicial:</span>
                        <button onClick={() => handleAssignClick({ id: 'openingPrayer', title: 'Oração Inicial' }, 'main')} className="text-blue-600 text-sm hover:underline">
                          Definir
                        </button>
                      </div>
                    )}

                    {weekData.openingPrayerId && (
                      <div onClick={(e) => e.stopPropagation()} className="ml-2">
                        <StatusEditMenu
                          variant="circle"
                          status={weekData.openingPrayerStatus}
                          onChange={(s) => setWeekData({ ...weekData, openingPrayerStatus: s })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* SEÇÕES DINÂMICAS */}
            {weekData.sections.map((section: any) => {
              // Render 'geral' section differently or just as a normal section?
              // User wants it to be standard parts.
              // We will style 'geral' slightly differently perhaps, or just generic.
              return (
                <div key={section.id}>
                  <div className={`px-4 py-2 rounded-t-lg ${section.color || (section.id === 'geral' ? 'bg-blue-600' : 'bg-gray-600')} text-white font-semibold flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      {section.id === 'geral' && <Users size={18} />}
                      {section.id === 'tesouros' && <Briefcase size={18} />}
                      {section.id === 'fsm' && <Users size={18} />}
                      {section.title}
                    </div>

                    {section.allowAdd && (
                      <div className="relative">
                        <button onClick={() => setActiveAddMenu(activeAddMenu === section.id ? null : section.id)} className="bg-white/20 hover:bg-white/30 p-1 rounded transition-colors">
                          <Plus size={20} />
                        </button>
                        {activeAddMenu === section.id && (
                          <div className="absolute right-0 top-8 bg-white text-gray-800 shadow-xl rounded-lg py-2 w-56 z-20 border border-gray-200">
                            <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">Adicionar Parte</p>
                            {getAvailablePartsForSection(section.id).map((tpl, idx) => (
                              <button key={idx} onClick={() => handleAddPart(section.id, tpl)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm">
                                {tpl.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border-x border-b rounded-b-lg divide-y">
                    {section.parts.map((part: any, _index: number) => {
                      const isClosingPrayer = part.id.includes('n_prayer');
                      const isBibleStudy = part.id.includes('n2-');
                      const isDraggable = (section.id === 'fsm' || (section.id === 'nvc' && !isClosingPrayer && !isBibleStudy));
                      const isFixedPart = isClosingPrayer || isBibleStudy;

                      return (
                        <div
                          key={part.id}
                          className={`p-4 pt-7 hover:bg-gray-50 transition-colors group relative ${draggedPart?.partId === part.id ? 'opacity-50 bg-gray-100' : ''}`}
                          draggable={isDraggable}
                          onDragStart={(e) => handleDragStart(e, part.id, section.id)}
                          onDragOver={handleDragOver}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, part.id, section.id)}
                        >
                          {/* Botão de Excluir - Visível só no Hover, e apenas para partes não fixas */}
                          {section.allowAdd && !isFixedPart && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestRemove(section.id, part.id);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                title="Remover parte"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          <div className={`flex flex-col sm:flex-row sm:items-start gap-4`}>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <EditableField value={part.title} onChange={(val) => handleUpdatePart(section.id, part.id, 'title', val)} className="font-bold text-gray-800 truncate" />
                                <EditableField value={part.time} onChange={(val) => handleUpdatePart(section.id, part.id, 'time', val)} className="text-xs bg-gray-100 text-gray-600 rounded flex-shrink-0" />
                              </div>

                              {!isClosingPrayer && (
                                <div className="mb-2 max-w-md">
                                  <EditableDescription value={part.description} onChange={(val) => handleUpdatePart(section.id, part.id, 'description', val)} />
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                {!part.assignedTo && <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={12} /> Não designado</span>}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[200px] flex-shrink-0">
                              {part.assignedTo ? (
                                <div onClick={() => handleAssignClick(part, 'main')} className={`flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-400 cursor-pointer`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 text-xs rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700`}>
                                      {participants.find(p => p.id === part.assignedTo)?.name.charAt(0)}
                                    </div>
                                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
                                      {participants.find(p => p.id === part.assignedTo)?.name}
                                    </span>
                                  </div>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <StatusEditMenu
                                      variant="circle"
                                      status={part.status}
                                      onChange={(s) => handleUpdatePart(section.id, part.id, 'status', s)}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => handleAssignClick(part, 'main')} className={`flex items-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded p-2 hover:bg-blue-50 justify-center`}>
                                  + Designar Titular
                                </button>
                              )}

                              {(part.hasOwnProperty('assistantId') || part.hasOwnProperty('readerId')) && (
                                <div className="relative">
                                  {part.assistantId || part.readerId ? (
                                    <div onClick={() => handleAssignClick(part, part.readerId !== undefined ? 'reader' : 'assistant')} className={`flex items-center justify-between bg-gray-50 rounded p-2 border border-transparent hover:bg-gray-100`}>
                                      <div onClick={() => handleAssignClick(part, part.readerId !== undefined ? 'reader' : 'assistant')} className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{part.readerId !== undefined ? 'Leitor:' : 'Ajudante:'}</span>
                                        <span className="text-sm text-gray-600 truncate max-w-[100px]">
                                          {participants.find(p => p.id === (part.assistantId || part.readerId))?.name}
                                        </span>
                                      </div>

                                      {/* Status do Ajudante ou Leitor - Círculo Editável */}
                                      {((section.id === 'fsm' && part.assistantId) || part.readerId) && (
                                        <StatusEditMenu
                                          variant="circle"
                                          status={(part.readerId ? part.readerStatus : part.assistantStatus) || 'PENDENTE'}
                                          onChange={(s) => handleUpdatePart(section.id, part.id, part.readerId ? 'readerStatus' : 'assistantStatus', s)}
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <button onClick={() => handleAssignClick(part, part.readerId !== undefined ? 'reader' : 'assistant')} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                                      + {part.readerId !== undefined ? 'Leitor' : 'Ajudante'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* FOOTER FIXO COM TEMPO TOTAL */}
      {!weekData.isCanceled && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-center items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className={`text-sm font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2 transition-colors ${isOverTime ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
            <Clock size={16} />
            <span>Tempo Total: {formatTotalTime(totalMinutes)}</span>
            <span className="font-normal text-gray-400 text-xs ml-1">/ 1h 45min</span>
          </div>
        </div>
      )}

      {/* Modais... */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, data: null })}
        onConfirm={executeRemovePart}
        title="Remover Parte"
        message="Tem certeza que deseja remover esta parte da programação?"
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Selecionar Participante</h3>
              <button onClick={() => setIsModalOpen(false)}><XCircle size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input type="text" placeholder="Buscar nome..." className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {getSuggestions().length > 0 ? getSuggestions().map(p => {
                // Determine if user has the SPECIFIC ability required (Reader or Main)
                let isApt = false;
                if (selectedPart?.templateId) {
                  if (selectedPart.roleTarget === 'reader') {
                    isApt = p.abilities?.includes(`${selectedPart.templateId}_reader`);
                  } else {
                    isApt = p.abilities?.includes(selectedPart.templateId);
                  }
                }

                return (
                  <button key={p.id} onClick={() => handleSelectParticipant(p.id)} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors text-left group">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold group-hover:bg-blue-200 group-hover:text-blue-700">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-1.5 rounded border">{p.type}</span>
                        {isApt &&
                          <span className="text-green-600 flex items-center gap-1"><Check size={10} /> Apto</span>
                        }
                      </div>
                    </div>
                  </button>
                )
              }) : <div className="p-8 text-center text-gray-500">Nenhum participante elegível encontrado.<br /><span className="text-xs">Verifique as habilidades ou gênero.</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
