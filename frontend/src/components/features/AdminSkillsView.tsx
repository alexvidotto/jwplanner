import { useState } from 'react';
import { ArrowLeft, Check, ChevronUp, ChevronDown, Briefcase, Users, User, Minus, Book, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';

// Added internal types for self-containment if not imported, but best to import.
interface AdminSkillsViewProps {
  participants: any[]; // Use any or strict type
  setParticipants: (p: any[]) => void;
  parts: any[];
  onBack: () => void;
}

export const AdminSkillsView = ({ participants, setParticipants, parts, onBack }: AdminSkillsViewProps) => {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Alternar habilidade para UM usuário
  const toggleAbility = (participantId: string, abilityKey: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const hasAbility = participant.abilities?.includes(abilityKey);
    let newAbilities;

    if (hasAbility) {
      newAbilities = participant.abilities.filter((a: string) => a !== abilityKey);
    } else {
      newAbilities = [...(participant.abilities || []), abilityKey];
    }

    setParticipants(participants.map(p => p.id === participantId ? { ...p, abilities: newAbilities } : p));
  };

  // Alternar habilidade para TODOS os selecionados
  const toggleBulkAbility = (abilityKey: string) => {
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) return;

    // Verificar se TODOS os selecionados já têm a habilidade
    const allSelectedHave = selectedArray.every(id => {
      const p = participants.find(user => user.id === id);
      return p?.abilities?.includes(abilityKey);
    });

    const newParticipants = participants.map(p => {
      if (!selectedIds.has(p.id)) return p;

      let newAbilities = p.abilities || [];
      if (allSelectedHave) {
        // Remover de todos
        newAbilities = newAbilities.filter((a: string) => a !== abilityKey);
      } else {
        // Adicionar a todos (se não tiver)
        if (!newAbilities.includes(abilityKey)) {
          newAbilities = [...newAbilities, abilityKey];
        }
      }
      return { ...p, abilities: newAbilities };
    });

    setParticipants(newParticipants);
  };

  // Selecionar/Deselecionar usuário individual
  const toggleSelectUser = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Selecionar/Deselecionar TODOS do grupo
  const toggleSelectAllGroup = (groupParticipants: any[]) => {
    const ids = groupParticipants.map(p => p.id);
    const allSelected = ids.every(id => selectedIds.has(id));
    const newSelected = new Set(selectedIds);

    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

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

  return (
    <div className={`bg-gray-50 min-h-screen ${selectedIds.size > 0 ? 'pb-[420px]' : 'pb-20'}`}>
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
            <h1 className="font-bold text-gray-800 text-lg">Matriz de Habilidades</h1>
          </div>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setSelectedIds(new Set())}>
              Limpar Seleção
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {groups.map(group => {
          const groupParticipants = participants.filter(p => p.type === group.id);
          if (groupParticipants.length === 0) return null;

          const allGroupSelected = groupParticipants.every(p => selectedIds.has(p.id));
          const someGroupSelected = groupParticipants.some(p => selectedIds.has(p.id));

          return (
            <div key={group.id}>
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg w-full md:w-fit md:min-w-[300px] ${group.bg} ${group.text} border ${group.border}`}>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm uppercase tracking-wider">{group.label}</span>
                  <span className="bg-white/50 px-2 rounded-full text-xs font-bold">{groupParticipants.length}</span>
                </div>

                {/* Checkbox de Selecionar Todos do Grupo */}
                <div
                  onClick={() => toggleSelectAllGroup(groupParticipants)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-white/20 px-2 py-1 rounded"
                >
                  <div className={`w-5 h-5 bg-white border border-current rounded flex items-center justify-center ${allGroupSelected ? 'bg-current' : ''}`}>
                    {allGroupSelected ? <Check size={14} className="text-white" /> : someGroupSelected ? <div className="w-3 h-3 bg-current rounded-sm" /> : null}
                  </div>
                  <span className="text-xs font-bold">Todos</span>
                </div>
              </div>

              <div className="space-y-3">
                {groupParticipants.map(p => {
                  const isExpanded = expandedUserId === p.id;
                  const isSelected = selectedIds.has(p.id);
                  const totalSkills = p.abilities?.length || 0;

                  return (
                    <div key={p.id} className={`bg-white rounded-xl border transition-all duration-200 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                      {/* Header do Usuário */}
                      <div className="p-4 flex items-center gap-4">
                        {/* Checkbox de Seleção Individual */}
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleSelectUser(p.id); }}
                          className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400'}`}
                        >
                          {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>

                        <div
                          onClick={() => setExpandedUserId(isExpanded ? null : p.id)}
                          className="flex-1 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className={`font-bold ${isExpanded ? 'text-blue-700' : 'text-gray-800'}`}>{p.name}</h3>
                              <p className="text-xs text-gray-500">{p.gender === 'PH' ? 'H' : 'M'} • {totalSkills} habilidades ativas</p>
                            </div>
                          </div>
                          <div className="text-gray-400">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>

                      {/* Área Expandida de Habilidades (Individual) */}
                      {isExpanded && !selectedIds.size && (
                        <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="grid md:grid-cols-3 gap-6">
                            {sections.map(section => {
                              const sectionParts = parts.filter(pt => pt.section === section.id);
                              if (sectionParts.length === 0) return null;

                              return (
                                <div key={section.id} className="space-y-3">
                                  <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${section.color}`}>
                                    <section.icon size={14} />
                                    {section.label}
                                  </div>
                                  <div className="space-y-2">
                                    {sectionParts.map(part => {
                                      const hasMainAbility = p.abilities?.includes(part.id);
                                      const hasReaderAbility = p.abilities?.includes(`${part.id}_reader`);

                                      return (
                                        <div key={part.id} className="flex flex-col gap-1">
                                          <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${hasMainAbility ? 'bg-white border-blue-300 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${hasMainAbility ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                              {hasMainAbility && <Check size={12} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={hasMainAbility || false} onChange={() => toggleAbility(p.id, part.id)} />
                                            <span className={`text-sm ${hasMainAbility ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{part.title}</span>
                                          </label>

                                          {part.requiresReader && (
                                            <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ml-4 ${hasReaderAbility ? 'bg-white border-purple-300 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${hasReaderAbility ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                                {hasReaderAbility && <Book size={10} className="text-white" strokeWidth={3} />}
                                              </div>
                                              <input type="checkbox" className="hidden" checked={hasReaderAbility || false} onChange={() => toggleAbility(p.id, `${part.id}_reader`)} />
                                              <span className={`text-xs ${hasReaderAbility ? 'font-medium text-purple-900' : 'text-gray-500'}`}>Leitor: {part.title}</span>
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {participants.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p>Nenhum participante cadastrado.</p>
          </div>
        )}
      </div>

      {/* PAINEL DE EDIÇÃO EM MASSA (FIXO NA PARTE INFERIOR) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-10 duration-300 max-h-[400px] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">{selectedIds.size}</div>
                <div>
                  <p className="font-bold text-sm">Editando Selecionados</p>
                  <p className="text-xs text-gray-400">Alterações aplicadas a todos</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setSelectedIds(new Set())}>
                <XCircle size={20} />
              </Button>
            </div>

            <div className="p-6 grid md:grid-cols-3 gap-6 pb-10">
              {sections.map(section => {
                const sectionParts = parts.filter(pt => pt.section === section.id);
                if (sectionParts.length === 0) return null;

                return (
                  <div key={section.id} className="space-y-3">
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${section.color}`}>
                      <section.icon size={14} />
                      {section.label}
                    </div>
                    <div className="space-y-2">
                      {sectionParts.map(part => {
                        const selectedArr = Array.from(selectedIds);
                        // Verifica quantos selecionados têm a habilidade
                        const countMain = selectedArr.filter(id => participants.find(p => p.id === id)?.abilities?.includes(part.id)).length;
                        const allMain = countMain === selectedIds.size;
                        const someMain = countMain > 0 && !allMain;

                        const countReader = selectedArr.filter(id => participants.find(p => p.id === id)?.abilities?.includes(`${part.id}_reader`)).length;
                        const allReader = countReader === selectedIds.size;
                        const someReader = countReader > 0 && !allReader;

                        return (
                          <div key={part.id} className="flex flex-col gap-1">
                            <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${allMain ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${allMain ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                {allMain && <Check size={12} className="text-white" strokeWidth={3} />}
                                {someMain && <Minus size={12} className="text-blue-600" strokeWidth={3} />}
                              </div>
                              <input type="checkbox" className="hidden" checked={allMain} onChange={() => toggleBulkAbility(part.id)} />
                              <span className="text-sm font-medium text-gray-700">{part.title}</span>
                            </label>

                            {part.requiresReader && (
                              <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ml-4 hover:bg-purple-50 ${allReader ? 'bg-purple-50 border-purple-200' : 'border-gray-200'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${allReader ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                  {allReader && <Book size={10} className="text-white" strokeWidth={3} />}
                                  {someReader && <Minus size={10} className="text-purple-600" strokeWidth={3} />}
                                </div>
                                <input type="checkbox" className="hidden" checked={allReader} onChange={() => toggleBulkAbility(`${part.id}_reader`)} />
                                <span className="text-xs font-medium text-gray-600">Leitor: {part.title}</span>
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
          </div>
        </div>
      )}
    </div>
  );
};
