import { useState, useMemo } from 'react';
import { ArrowLeft, Check, Search, Briefcase, Users, User, Minus, Book, X, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { useBulkUpdateParticipants } from '../../hooks/useParticipants';

interface AdminSkillsViewProps {
  participants: any[];
  setParticipants: (p: any[]) => void;
  parts: any[];
  onBack: () => void;
  isDirty?: boolean;
  setIsDirty?: (dirty: boolean) => void;
}

export const AdminSkillsView = ({ participants, setParticipants, parts, onBack, setIsDirty }: AdminSkillsViewProps) => {
  const [localParticipants, setLocalParticipants] = useState<any[]>(participants);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [changedUserIds, setChangedUserIds] = useState<Set<string>>(new Set());
  const [showMobileSkills, setShowMobileSkills] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const bulkUpdateParticipants = useBulkUpdateParticipants();

  // Sync local participants if props change (e.g. initial load or refetch) AND we don't have unsaved changes
  useMemo(() => {
    // Only update from props if we haven't made changes locally, OR if it's a fresh load (changedUserIds empty)
    // Actually, getting fresh data should probably overwrite unless we deal with conflicts.
    // Ideally, we reset local state when prop participants changes deeply.
    // For simplicity, let's sync if changedUserIds is empty.
    if (changedUserIds.size === 0) {
      setLocalParticipants(participants);
    }
  }, [participants, changedUserIds.size]);

  const groups = [
    { id: 'ANCIAO', label: 'Anciãos', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    { id: 'SERVO', label: 'Servos Ministeriais', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    { id: 'PUB_HOMEM', label: 'Publicadores (Homens)', bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
    { id: 'PUB_MULHER', label: 'Publicadoras', bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
  ];

  const sections = [
    { id: 'geral', label: 'Reunião / Geral', icon: Users, color: 'text-blue-900' },
    { id: 'tesouros', label: 'Tesouros da Palavra', icon: Briefcase, color: 'text-gray-600' },
    { id: 'fsm', label: 'Faça Seu Melhor', icon: Users, color: 'text-yellow-600' },
    { id: 'nvc', label: 'Nossa Vida Cristã', icon: User, color: 'text-red-700' },
  ];

  // Logic to toggle skill for ALL selected users
  const handleToggleSkill = (skillId: string) => {
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) return;

    // Check if ALL selected users ALREADY have this skill
    const allSelectedHave = selectedArray.every(id => {
      const p = localParticipants.find(user => user.id === id);
      return p?.abilities?.includes(skillId);
    });

    const newParticipants = localParticipants.map(p => {
      if (!selectedIds.has(p.id)) return p;

      let newAbilities = p.abilities || [];
      if (allSelectedHave) {
        // Remove from all
        newAbilities = newAbilities.filter((a: string) => a !== skillId);
      } else {
        // Add to all (if missing)
        if (!newAbilities.includes(skillId)) {
          newAbilities = [...newAbilities, skillId];
        }
      }

      return { ...p, abilities: newAbilities };
    });

    setLocalParticipants(newParticipants);

    // Mark updated users as changed
    setChangedUserIds(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => next.add(id));
      // Trigger global dirty state
      if (next.size > 0 && setIsDirty) {
        setIsDirty(true);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const idsToSave = Array.from(changedUserIds);
    if (idsToSave.length === 0) return;

    const changes = localParticipants
      .filter(p => changedUserIds.has(p.id))
      .map(p => ({ id: p.id, abilities: p.abilities || [] }));

    try {
      await bulkUpdateParticipants.mutateAsync(changes);
      setChangedUserIds(new Set());
      if (setIsDirty) setIsDirty(false); // Clear global dirty
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setShowMobileSkills(false); // Close mobile modal on save
      // Propagate changes to parent if needed, although invalidation usually handles it
      setParticipants(localParticipants); 
    } catch (error) {
      console.error('Failed to save skills:', error);
      alert('Erro ao salvar habilidades.');
    }
  };

  const toggleSelectUser = (id: string, multiSelect: boolean) => {
    const newSelected = new Set(multiSelect ? selectedIds : []);
    if (newSelected.has(id)) {
      if (multiSelect) newSelected.delete(id);
      else newSelected.clear(); // Clicking selected in single mode -> Deselect? Or just keep? Let's keep.
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectGroup = (groupId: string) => {
    const groupParticipants = localParticipants.filter(p => p.type === groupId);
    const allSelected = groupParticipants.every(p => selectedIds.has(p.id));

    const newSelected = new Set(selectedIds);
    if (allSelected) {
      groupParticipants.forEach(p => newSelected.delete(p.id));
    } else {
      groupParticipants.forEach(p => newSelected.add(p.id));
    }
    setSelectedIds(newSelected);
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return localParticipants;
    const lower = searchTerm.toLowerCase();
    return localParticipants.filter(p => p.name.toLowerCase().includes(lower));
  }, [localParticipants, searchTerm]);

  // Render Skills Grid (Reused for Desktop and Mobile)
  const SkillsGrid = () => (
    <div className="space-y-6 pb-20 md:pb-0">
      {sections.map(section => {
        const sectionParts = parts.filter(pt => pt.section === section.id);
        if (sectionParts.length === 0) return null;

        return (
          <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50`}>
              <section.icon size={16} className={section.color} />
              <span className={`text-sm font-bold uppercase tracking-wider ${section.color}`}>{section.label}</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionParts.map(part => {
                const selectedArr = Array.from(selectedIds);

                // MAIN ABILITY
                const countMain = selectedArr.filter(id => localParticipants.find(p => p.id === id)?.abilities?.includes(part.id)).length;
                const allMain = selectedArr.length > 0 && countMain === selectedArr.length;
                const someMain = countMain > 0 && !allMain;

                // READER ABILITY
                const countReader = selectedArr.filter(id => localParticipants.find(p => p.id === id)?.abilities?.includes(`${part.id}_reader`)).length;
                const allReader = selectedArr.length > 0 && countReader === selectedArr.length;
                const someReader = countReader > 0 && !allReader;

                return (
                  <div key={part.id} className="flex flex-col gap-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none
                      ${allMain ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 
                        ${allMain ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                        {allMain && <Check size={14} className="text-white" strokeWidth={3} />}
                        {someMain && <Minus size={14} className="text-blue-600" strokeWidth={3} />}
                      </div>
                      <input type="checkbox" className="hidden" checked={allMain} onChange={() => handleToggleSkill(part.id)} />
                      <span className={`text-sm ${allMain ? 'font-medium text-blue-900' : 'text-gray-700'}`}>{part.title}</span>
                    </label>

                    {part.requiresReader && (
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ml-6 relative
                        ${allReader ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200' : 'bg-white border-gray-200 hover:border-purple-300'}`}>
                        <div className="absolute -left-6 top-1/2 w-4 h-[1px] bg-gray-300"></div>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 
                          ${allReader ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                          {allReader && <Book size={12} className="text-white" strokeWidth={3} />}
                          {someReader && <Minus size={12} className="text-purple-600" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" className="hidden" checked={allReader} onChange={() => handleToggleSkill(`${part.id}_reader`)} />
                        <span className={`text-xs ${allReader ? 'font-medium text-purple-900' : 'text-gray-600'}`}>Leitor</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b z-20 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
            <h1 className="font-bold text-gray-800 text-lg flex items-center">
              Matriz de Habilidades
              {changedUserIds.size > 0 && (
                <span className="hidden md:inline-flex text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                  Alterações não salvas
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={changedUserIds.size > 0 ? "warning" : "primary"}
              onClick={handleSave}
              disabled={changedUserIds.size === 0 || bulkUpdateParticipants.isPending}
              className={changedUserIds.size > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' : ''}
            >
              <Save size={16} className="mr-2" />
              {bulkUpdateParticipants.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR - PARTICIPANTS LIST */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col border-r bg-white h-full">
          {/* Search Bar */}
          <div className="p-3 border-b bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar participantes..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 pb-24 space-y-4">
            {groups.map(group => {
              const groupParticipants = filteredParticipants.filter(p => p.type === group.id);
              if (groupParticipants.length === 0) return null;

              const allSelected = groupParticipants.every(p => selectedIds.has(p.id));
              const someSelected = groupParticipants.some(p => selectedIds.has(p.id));

              return (
                <div key={group.id}>
                  <div className={`sticky top-0 z-10 mx-1 mb-1 px-3 py-1.5 rounded-lg flex items-center justify-between backdrop-blur-sm shadow-sm border ${group.bg} ${group.border} ${group.text}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">{group.label}</span>
                    <button onClick={() => toggleSelectGroup(group.id)} className="p-1 hover:bg-white/50 rounded transition-colors">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-current border-current' : 'border-gray-400 bg-white'}`}>
                        {allSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                        {someSelected && !allSelected && <div className="w-2 h-2 bg-current rounded-sm" />}
                      </div>
                    </button>
                  </div>
                  <div className="space-y-1 px-1">
                    {groupParticipants.map(p => {
                      const isSelected = selectedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={(e) => toggleSelectUser(p.id, e.ctrlKey || e.metaKey || true)} // Always toggle on click for now? Or Exclusive? Let's do Toggle for ease.
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{p.name}</h4>
                            <p className="text-xs text-gray-500">{p.abilities?.length || 0} habilidades</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filteredParticipants.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhum participante encontrado.</p>
              </div>
            )}
          </div>

          {/* Mobile Bottom Bar for Actions (Visible only on mobile when selected) */}
          {selectedIds.size > 0 && (
            <div className="md:hidden fixed bottom-[80px] left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-200">
              <Button
                onClick={() => setShowMobileSkills(true)}
                className="w-full shadow-xl bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg font-semibold"
              >
                {selectedIds.size === 1 ? 'Editar 1 Participante' : `Editar ${selectedIds.size} Participantes`}
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT MAIN AREA (SKILLS) - Desktop Hidden on Mobile */}
        <div className="hidden md:flex flex-1 flex-col bg-gray-50/50 h-full overflow-hidden relative">
          {selectedIds.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase size={40} className="opacity-20 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Selecione Participantes</h3>
              <p className="text-sm max-w-xs">Selecione um ou mais participantes na lista ao lado para gerenciar suas habilidades.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-10">
                <div>
                    <h2 className="font-bold text-gray-800">Editando Habilidades</h2>
                    <p className="text-xs text-gray-500">{selectedIds.size} participantes selecionados</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-red-600 hover:bg-red-50">
                    Limpar Seleção
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <SkillsGrid />
                </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SKILLS MODAL/DRAWER */}
      {showMobileSkills && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white animate-in slide-in-from-bottom-full duration-300">
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
            <div>
              <h2 className="font-bold text-gray-800">Habilidades</h2>
              <p className="text-xs text-gray-500">{selectedIds.size} selecionados</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSkills(false)}>
                <X size={24} />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <SkillsGrid />
          </div>
          <div className="p-4 border-t bg-white">
            <Button onClick={handleSave} className="w-full" disabled={changedUserIds.size === 0}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 z-[60]">
          <Check size={20} />
          <span className="font-bold">Salvo com sucesso!</span>
        </div>
      )}
    </div>
  );
};
