import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, MoreVertical, CheckCircle, Info, CalendarX, Briefcase, Users, Plus, Trash2, AlertTriangle, Clock, XCircle, Search, Check, ArrowLeft, Loader2, X, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusEditMenu } from '../ui/StatusEditMenu';
import { EditableField } from '../ui/EditableField';
import { EditableDescription } from '../ui/EditableDescription';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Toast } from '../ui/Toast';
import { parseTime, formatTotalTime } from '../../lib/utils';
import { useSuggestions } from '../../hooks/useSuggestions';
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
  const [showClearConfirm, setShowClearConfirm] = useState<{ isOpen: boolean; type: string; partId: string; role: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draggedPart, setDraggedPart] = useState<{ partId: string, sectionId: string } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, data: any }>({ isOpen: false, data: null });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const totalMinutes = weekData.sections.reduce((acc: number, section: any) => {
    return acc + section.parts.reduce((pAcc: number, part: any) => {
      if (part.hasTime === false || part.hasTime === null) {
        // Fallback if not set, assume true unless explicitly false?
        // Schema default is true, but transformer sets it.
        // If hasTime is explicitly false, 0.
        // If undefined, assume true?
        return pAcc;
      }
      // If explicitly false, exclude.
      // The transformer sets it to true/false.
      if (part.hasTime === false) return pAcc;

      return pAcc + parseTime(part.time)
    }, 0);
  }, 0);

  const partNumbers = useMemo(() => {
    const map = new Map<string, number>();
    const orderedSectionIds = ['tesouros', 'fsm', 'nvc'];
    let count = 0;

    orderedSectionIds.forEach(id => {
      const section = weekData.sections.find((s: any) => s.id === id);
      if (section && section.parts) {
        section.parts.forEach((p: any) => {
          if (p.title === 'Oração Final' || p.id.includes('n_prayer')) return;
          map.set(p.id, ++count);
        });
      }
    });
    return map;
  }, [weekData.sections]);

  const presidentTemplate = partTemplates.find(pt => pt.title === 'Presidente');

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

  const handleClearAssignment = () => {
    if (!showClearConfirm) return;
    const { type, partId, role } = showClearConfirm;

    const newWeekData = { ...weekData };

    if (type === 'president') {
      newWeekData.presidentId = null;
      newWeekData.presidentStatus = 'PENDENTE';
    } else if (type === 'openingPrayer') {
      newWeekData.openingPrayerId = null;
      newWeekData.openingPrayerStatus = 'PENDENTE';
      // Also clear potentially linked part if it exists (though usually virtual)
    } else if (type === 'assignment') {
      newWeekData.sections = newWeekData.sections.map((section: any) => ({
        ...section,
        parts: section.parts.map((p: any) => {
          if (p.id === partId) {
            if (role === 'reader') return { ...p, readerId: null, readerStatus: 'PENDENTE' };
            if (role === 'assistant') return { ...p, assistantId: null, assistantStatus: 'PENDENTE' };
            return { ...p, assignedTo: null, status: 'PENDENTE' };
          }
          return p;
        })
      }));
    }

    setWeekData(newWeekData);
    setShowClearConfirm(null);
    showToast("Designação removida.");
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
    // 0. Check for conflicts (Double Assignment)
    const findConflicts = () => {
      const conflicts: string[] = [];

      // Helper to format conflict message
      const addConflict = (role: string, context: string) => {
        conflicts.push(`${role} em "${context}"`);
      };

      // Check President
      if (weekData.presidentId === participantId) {
        // Exception: Allowed if assigning Opening Prayer
        if (selectedPart.id !== 'president' && selectedPart.id !== 'openingPrayer') {
          addConflict('Presidente', 'Reunião');
        } else if (selectedPart.id === 'president') {
          // Assigning president to president? No conflict (same slot), but we are effectively swapping/setting.
        }
      }

      // Check Opening Prayer
      if (weekData.openingPrayerId === participantId) {
        // Exception: Allowed if assigning President
        if (selectedPart.id !== 'president' && selectedPart.id !== 'openingPrayer') {
          addConflict('Oração Inicial', 'Reunião');
        }
      }

      // Check Parts
      weekData.sections.forEach((section: any) => {
        section.parts.forEach((p: any) => {
          // Skip checking against the exact same slot we are assigning to (id + role)
          // But here we just check if person is in part p

          if (p.assignedTo === participantId) {
            // If we are assigning to THIS part as TITULAR, it's just a replace, not a conflict.
            if (p.id !== selectedPart.id || selectedPart.roleTarget !== 'main') {
              addConflict('Titular', p.title);
            }
          }
          if (p.assistantId === participantId) {
            if (p.id !== selectedPart.id || selectedPart.roleTarget !== 'assistant') {
              addConflict('Ajudante', p.title);
            }
          }
          if (p.readerId === participantId) {
            if (p.id !== selectedPart.id || selectedPart.roleTarget !== 'reader') {
              addConflict('Leitor', p.title);
            }
          }
        });
      });

      return conflicts;
    };

    const conflicts = findConflicts();

    if (conflicts.length > 0) {
      setConfirmDialog({
        isOpen: true,
        data: {
          action: () => executeAssignment(participantId),
          isWarning: true,
          message: `Este participante já está designado como: ${conflicts.join(', ')}. Deseja repetir a designação?`
        }
      });
      setIsModalOpen(false);
      return;
    }

    executeAssignment(participantId);
    setIsModalOpen(false);
  };

  const executeAssignment = (participantId: string) => {
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
      return;
    }

    if (selectedPart.id === 'openingPrayer') {
      setWeekData({
        ...weekData,
        openingPrayerId: participantId,
        openingPrayerStatus: 'PENDENTE'
      });
      return;
    }

    const updatedSections = weekData.sections.map((section: any) => ({
      ...section,
      parts: section.parts.map((p: any) => {
        if (p.id === selectedPart.id) {
          if (selectedPart.roleTarget === 'assistant') return { ...p, assistantId: participantId };
          if (selectedPart.roleTarget === 'reader') return { ...p, readerId: participantId };

          const newPart = { ...p, assignedTo: participantId, status: 'PENDENTE' };
          return newPart;
        }
        return p;
      })
    }));

    // Post-process for auto-assignment
    if (selectedPart.title === 'Presidente') {
      // ... existing logic but unreachable as handled above in if(selectedPart.id === 'president') block? 
      // standard parts usually don't have title 'Presidente' unless it's a part template named Presidente treated as standard?
      // The 'Presidente' handled above uses ID 'president'.
      // If there is a PART with title 'Presidente' in sections, it's treated here.
      // But assuming 'Presidente' is the top card with ID 'president'.
    }

  setWeekData({ ...weekData, sections: updatedSections });
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
      requiresAssistant: template.requiresAssistant,
      requiresReader: template.requiresReader,
      hasObservation: template.hasObservation,
      hasTime: template.hasTime,
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

  // Determine effective Week Identifier for suggestions
  // If we have a DB ID, use it. If not (new week), use the Date string properly formatted.
  // Actually, useSuggestions now handles date strings. Let's prefer date string if we have it for simplicity?
  // No, useSuggestions logic: if UUID -> ID lookup. If Date -> Date lookup.
  // If we have a loaded weekData with ID, use ID.
  const weekIdentifier = (weekData?.id && !weekData.id.startsWith('new-') && !weekData.id.startsWith('virtual-'))
    ? weekData.id
    : (weekData.date?.toISOString() || '');

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useSuggestions(
    weekIdentifier,
    selectedPart?.templateId || selectedPart?.id // Fallback to ID for special roles like president
  );

  const filteredSuggestions = useMemo(() => {
    if (!selectedPart) return [];

    // Fallback: If hook returns empty or failed, maybe we should fall back to 'participants' (local)? 
    // Plan says "Replace". If backend is authority, we trust backend for sorting.
    // BUT backend 'getSuggestions' endpoint handles filtering by Skill and Unavailability.
    // We still need to filter by 'Active', 'Gender' (Assistant), 'Role' (Reader vs Principal if backend mixes them).

    if (isLoadingSuggestions || !suggestions) return [];

    // ... filtering logic ...
    const source = suggestions;

    return source.filter((p: any) => {
    // 0. Filtro de Ativo
      if (p.active === false) return false;

      // 1. Filtro de Ajudante (Gênero)
      if (selectedPart?.roleTarget === 'assistant') {
        const mainPart = weekData?.sections?.flatMap((s: any) => s.parts).find((pt: any) => pt.id === selectedPart.id);
        const mainPerson = participants.find(user => user.id === mainPart?.assignedTo);
        // If main person is PM (Woman), assistant must be PM (Woman).
        // If main person is PH (Man), assistant can be PH (Man).
        if (mainPerson?.gender === 'PM' && p.gender !== 'PM') return false;
        // if (mainPerson?.gender === 'PH' && p.gender !== 'PH') return false; // Men usually have Men assistants, but sometimes Women? No, usually Men-Men or Women-Women in school.
        // Actually, rarely a man has a woman assistant unless it's a specific setting, but usually strict matching.
        // Safe default: Match gender.
        if (mainPerson?.gender && p.gender !== mainPerson.gender) return false;
      }

      // 2. Filtro de Habilidade (Refinement)
      // 2. Filter by Ability
      if (selectedPart?.templateId) {
        // President: Special handling (no ability check, just type)
        if (selectedPart.templateId === 'president') {
          if (p.type !== 'ANCIAO') return false;
          return true;
        }

        // Opening Prayer: Special handling
        if (selectedPart.templateId === 'openingPrayer') {
          // Helper for gender check if needed, but backend handles it mostly.
          // Frontend strict check:
          if (p.type === 'PUB_MULHER') return false;
          return true;
        }

        // Reader: Check reader ability
        if (selectedPart.roleTarget === 'reader') {
          const readerAbility = `${selectedPart.templateId}_reader`;
          // Check specific reader ability
          if (!p.abilities?.includes(readerAbility)) {
            // Optional: Fail if strict
            return false;
          }
        } else {
          // Normal Assignment: Check standard ability
          if (!p.abilities?.includes(selectedPart.templateId)) return false;
        }
      }

      return true;
    });
  }, [suggestions, isLoadingSuggestions, selectedPart, weekData, participants]);

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
                  <div className="w-full sm:min-w-[280px]">
                  {weekData.presidentId ? (
                      <div onClick={() => handleAssignClick({ id: 'president', title: 'Presidente', templateId: 'president' }, 'main')} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-400 cursor-pointer transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
                          {participants.find(p => p.id === weekData.presidentId)?.name.charAt(0)}
                        </div>
                          <span className="text-gray-700 font-medium whitespace-nowrap">
                          {participants.find(p => p.id === weekData.presidentId)?.name}
                        </span>
                      </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setShowClearConfirm({ isOpen: true, type: 'president', partId: 'president', role: 'president' })} className="text-gray-400 hover:text-red-500 p-1"><XCircle size={18} /></button>
                        <StatusEditMenu
                          variant="circle"
                          status={weekData.presidentStatus}
                          onChange={(s) => setWeekData({ ...weekData, presidentStatus: s })}
                        />
                      </div>
                    </div>
                  ) : (
                        <button onClick={() => handleAssignClick({ id: 'president', title: 'Presidente', templateId: 'president' }, 'main')} className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded p-2 hover:bg-blue-50 transition-colors">
                      + Designar Presidente
                    </button>
                  )}
                </div>

                {/* Opening Prayer */}
                  <div className="w-full sm:min-w-[280px]">
                    {weekData.openingPrayerId ? (
                      <div onClick={() => handleAssignClick({ id: 'openingPrayer', title: 'Oração Inicial', role: 'openingPrayer' }, 'openingPrayer')} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded hover:border-blue-400 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 flex-shrink-0">Oração Inicial:</span>
                          <span className="text-sm text-gray-700 whitespace-nowrap">
                            {participants.find(p => p.id === weekData.openingPrayerId)?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setShowClearConfirm({ isOpen: true, type: 'openingPrayer', partId: 'openingPrayer', role: 'openingPrayer' })} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"><XCircle size={14} /></button>
                          {weekData.openingPrayerId !== weekData.presidentId && (
                            <StatusEditMenu
                              variant="circle"
                              status={weekData.openingPrayerStatus}
                              onChange={(s) => setWeekData({ ...weekData, openingPrayerStatus: s })}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => handleAssignClick({ id: 'openingPrayer', title: 'Oração Inicial', role: 'openingPrayer' }, 'openingPrayer')} className="w-full flex items-center justify-between bg-gray-50 rounded px-2 py-2 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-gray-400 text-sm font-medium whitespace-nowrap flex-shrink-0">Oração Inicial:</span>
                          <div className="flex items-center gap-2 text-gray-400 text-sm px-3 py-1.5 border border-dashed rounded-lg hover:bg-gray-100 w-full bg-white whitespace-nowrap">
                            <Plus size={16} className="flex-shrink-0" />
                            <span>Designar Oração</span>
                          </div>
                        </div>
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
                            {partNumbers.has(part.id) && (
                              <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-500 font-bold text-xs flex-shrink-0 mt-0.5">
                                {partNumbers.get(part.id)}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {partNumbers.has(part.id) && (
                                  <div className="sm:hidden flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-500 font-bold text-[10px] flex-shrink-0 mr-1">
                                    {partNumbers.get(part.id)}
                                  </div>
                                )}
                                <EditableField value={part.title} onChange={(val) => handleUpdatePart(section.id, part.id, 'title', val)} className="font-bold text-gray-800 truncate" />
                                {part.hasTime !== false && (
                                  <EditableField value={part.time} onChange={(val) => handleUpdatePart(section.id, part.id, 'time', val)} className="text-xs bg-gray-100 text-gray-600 rounded flex-shrink-0" />
                                )}
                              </div>

                              {part.hasObservation && (
                                <div className="mb-2 max-w-md">
                                  <EditableDescription value={part.observation} onChange={(val) => handleUpdatePart(section.id, part.id, 'observation', val)} />
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
                                    <div className={`w-6 h-6 text-xs rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 flex-shrink-0`}>
                                      {participants.find(p => p.id === part.assignedTo)?.name.charAt(0)}
                                    </div>
                                    <span className="text-sm text-gray-700 whitespace-nowrap">
                                      {participants.find(p => p.id === part.assignedTo)?.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setShowClearConfirm({ isOpen: true, type: 'assignment', partId: part.id, role: 'titular' })} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"><XCircle size={16} /></button>
                                    <StatusEditMenu
                                      variant="circle"
                                      status={part.status}
                                      onChange={(s) => handleUpdatePart(section.id, part.id, 'status', s)}
                                    />
                                  </div>
                                </div>
                              ) : (
                                  <button onClick={() => handleAssignClick(part, 'main')} className="flex items-center justify-between p-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50">
                                    <span>+ Designar {part.requiresAssistant || part.requiresReader ? 'Titular' : 'Participante'}</span>
                                </button>
                              )}


                              {part.requiresAssistant && (
                                <div className="ml-4 border-l-2 border-gray-200 pl-2">
                                  {part.assistantId ? (
                                    <div onClick={() => handleAssignClick(part, 'assistant')} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded hover:border-blue-400 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-green-600 flex-shrink-0">Ajudante:</span>
                                        <span className="text-sm text-gray-700 whitespace-nowrap">{participants.find(p => p.id === part.assistantId)?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => setShowClearConfirm({ isOpen: true, type: 'assignment', partId: part.id, role: 'assistant' })} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"><XCircle size={14} /></button>
                                        <StatusEditMenu variant="circle" status={part.assistantStatus} onChange={(s) => handleUpdatePart(section.id, part.id, 'assistantStatus', s)} />
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => handleAssignClick(part, 'assistant')} className="w-full text-left text-xs text-green-600 hover:underline pl-2">
                                      + Ajudante
                                    </button>
                                  )}
                                </div>
                              )}

                              {part.requiresReader && (
                                <div className="ml-4 border-l-2 border-gray-200 pl-2">
                                  {part.readerId ? (
                                    <div onClick={() => handleAssignClick(part, 'reader')} className="flex items-center justify-between p-2 bg-purple-50 border border-gray-200 rounded hover:border-blue-400 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-purple-600 flex-shrink-0">Leitor:</span>
                                        <span className="text-sm text-gray-700 whitespace-nowrap">{participants.find(p => p.id === part.readerId)?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => setShowClearConfirm({ isOpen: true, type: 'assignment', partId: part.id, role: 'reader' })} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"><XCircle size={14} /></button>
                                        <StatusEditMenu variant="circle" status={part.readerStatus} onChange={(s) => handleUpdatePart(section.id, part.id, 'readerStatus', s)} />
                                      </div>
                                    </div>
                                  ) : (
                                      <button onClick={() => handleAssignClick(part, 'reader')} className="w-full text-left text-xs text-purple-600 hover:underline pl-2">
                                        + Leitor
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
        title={confirmDialog.data?.isWarning ? "Aviso de Duplicidade" : "Remover Parte"}
        message={confirmDialog.data?.message || "Tem certeza que deseja remover esta parte? Esta ação não pode ser desfeita."}
        onConfirm={() => {
          if (confirmDialog.data?.action) {
            confirmDialog.data.action();
            setConfirmDialog({ isOpen: false, data: null });
          } else {
            executeRemovePart();
          }
        }}
        confirmLabel={confirmDialog.data?.isWarning ? "Sim, designar mesmo assim" : "Confirmar"}
        onClose={() => setConfirmDialog({ isOpen: false, data: null })}
      />

      <ConfirmModal
        isOpen={!!showClearConfirm?.isOpen}
        title="Limpar Designação"
        message="Tem certeza que deseja remover esta designação?"
        onConfirm={handleClearAssignment}
        onClose={() => setShowClearConfirm(null)}
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
              {isLoadingSuggestions ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  <Loader2 size={32} className="animate-spin mb-2" />
                  <p>Buscando sugestões...</p>
                </div>
              ) : filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((p: any, index: number) => {
                // Determine if user has the SPECIFIC ability required (Reader or Main)
                let isApt = false;
                if (selectedPart?.templateId) {
                  if (selectedPart.roleTarget === 'reader') {
                    isApt = p.abilities?.includes(`${selectedPart.templateId}_reader`);
                  } else {
                    isApt = p.abilities?.includes(selectedPart.templateId);
                  }
                }

              // Actually the sorting already puts best first. Let's just highlight top 1 as "Best" or just show history.

                return (
                  <button key={p.id} onClick={() => handleSelectParticipant(p.id)} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors text-left group border-b border-transparent hover:border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold group-hover:bg-blue-200 group-hover:text-blue-700 relative flex-shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 truncate">{p.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                        <span className="bg-gray-100 px-1.5 rounded border">{p.type}</span>
                        {isApt &&
                          <span className="text-green-600 flex items-center gap-1"><Check size={10} /> Apto</span>
                        }
                      </div>

                      {p.history && p.history.length > 0 && (
                        <div className="mt-2 space-y-1 bg-white/50 p-1.5 rounded border border-gray-100">
                          {p.history.map((h: any, idx: number) => {
                            // Determine color flag based on date relative to TODAY (Real time)
                            const now = new Date();
                            const histDate = new Date(h.date);

                            // Check months difference
                            const nowMonth = now.getMonth() + now.getFullYear() * 12;
                            const histMonth = histDate.getMonth() + histDate.getFullYear() * 12;
                            const diff = nowMonth - histMonth;

                            let flagClass = "bg-gray-100 text-gray-500"; // Default (older)

                            // Priority: Future (relative to NOW) -> Green
                            if (histDate > now) {
                              flagClass = "bg-green-100 text-green-700";
                            } else if (diff === 0) {
                              // Past/Today but Current Month
                              flagClass = "bg-yellow-100 text-yellow-700";
                            } else if (diff === 1) {
                              // Previous Month
                              flagClass = "bg-red-100 text-red-700";
                            } else {
                              // Older than previous month
                              flagClass = "bg-gray-100 text-gray-500";
                            }

                            return (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="truncate max-w-[150px] text-gray-700 font-medium">
                                  {h.title}
                                </span>
                                <div className={`flex items-center gap-2 flex-shrink-0 px-1.5 py-0.5 rounded ${flagClass}`}>
                                  <span className="font-bold uppercase text-[9px]">
                                    {h.role === 'PRESIDENTE' ? 'PRE' :
                                      h.role === 'TITULAR' ? 'TIT' : 
                                        h.role === 'AJUDANTE' ? 'AJD' :
                                          h.role === 'LEITOR' ? 'LEI' : h.role.substring(0, 3)}
                                  </span>
                                  <span>{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                )
            })) : (
                <div className="p-8 text-center text-gray-500">
                  Nenhum participante elegível encontrado.<br />
                  <span className="text-xs">Verifique as habilidades ou gênero.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
