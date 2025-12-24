import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Check, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PRIVILEGE_OPTIONS } from '../../lib/constants';
import { useCreateParticipant, useUpdateParticipant, useDeleteParticipant, useParticipantHistory } from '../../hooks/useParticipants';
import { Loader2 } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  type: string;
  gender: string;
  phone?: string;
  active?: boolean;
  abilities: string[];
}

interface AdminParticipantsViewProps {
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
  onBack: () => void;
}

export const AdminParticipantsView = ({ participants, onBack }: AdminParticipantsViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: history, isLoading: isLoadingHistory } = useParticipantHistory(editingId);
  const [formData, setFormData] = useState({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Participant | 'status' | 'privilege'; direction: 'asc' | 'desc' } | null>(null);

  const createParticipant = useCreateParticipant();
  const updateParticipant = useUpdateParticipant();
  const deleteParticipant = useDeleteParticipant();

  // Helper para determinar o Privilégio na UI (agrupando PUB_HOMEM e PUB_MULHER)
  const getUiPrivilege = (type: string) => {
    if (type === 'ANCIAO') return 'ANCIAO';
    if (type === 'SERVO') return 'SERVO';
    return 'PUBLICADOR'; // Agrupa PUB_HOMEM e PUB_MULHER
  };

  const handleSave = async () => {
    if (!formData.name) return;

    try {
      const payload = {
        nome: formData.name,
        privilegio: formData.type as any, // Cast to match enum if needed
        // Gender is implied by privilegio (PUB_HOMEM vs PUB_MULHER) for database,
        // but frontend tracks gender to help select specific privilege.
        // We ensure formData.type is correct before saving.
        telefone: formData.phone || null,
        podeDesignar: formData.active
      };

      if (editingId) {
        await updateParticipant.mutateAsync({ id: editingId, ...payload });
      } else {
        // Auto-generate email like in other parts of app for consistency, or leave null
        const email = `${formData.name.toLowerCase().replace(/\s/g, '.')}@example.com`;
        await createParticipant.mutateAsync({ ...payload, email });
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true });
    } catch (error) {
      console.error('Failed to save participant:', error);
      alert('Erro ao salvar participante. Verifique o console.');
    }
  };

  const handleEdit = (p: Participant) => {
    setEditingId(p.id);
    setFormData({ name: p.name, type: p.type, gender: p.gender, phone: p.phone || '', active: p.active !== false });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteParticipant.mutateAsync(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete participant:', error);
      alert('Erro ao excluir participante.');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean | undefined) => {
    try {
      await updateParticipant.mutateAsync({ id, podeDesignar: !currentActive });
    } catch (error) {
      console.error('Failed to toggle active status:', error);
      alert('Erro ao alterar status.');
    }
  };

  const isDirty = useMemo(() => {
    if (!editingId) return !!formData.name; // New user: dirty if name has content
    // Find original
    const original = participants.find(p => p.id === editingId);
    if (!original) return false;

    return (
      formData.name !== original.name ||
      formData.type !== original.type ||
      formData.gender !== original.gender ||
      (formData.phone || '') !== (original.phone || '') ||
      formData.active !== (original.active !== false)
    );
  }, [formData, editingId, participants]);

  const handleSort = (key: keyof Participant | 'status' | 'privilege') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedParticipants = useMemo(() => {
    let result = [...participants];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerTerm) ||
        (p.phone && p.phone.includes(lowerTerm)) ||
        p.type.toLowerCase().includes(lowerTerm)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        if (sortConfig.key === 'status') {
          aValue = a.active ? 1 : 0;
          bValue = b.active ? 1 : 0;
        } else if (sortConfig.key === 'privilege') {
          // Custom order: ANCIÃO > SERVO > PIONEIRO > PUBLICADOR
          const privilegeOrder = { 'ANCIAO': 3, 'SERVO': 2, 'PIONEIRO': 1 };
          aValue = privilegeOrder[a.type as keyof typeof privilegeOrder] || 0;
          bValue = privilegeOrder[b.type as keyof typeof privilegeOrder] || 0;
        } else {
          aValue = a[sortConfig.key as keyof Participant] || '';
          bValue = b[sortConfig.key as keyof Participant] || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [participants, searchTerm, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-400 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 sm:ml-0"><ArrowLeft size={20} /></Button>
              <h1 className="font-bold text-gray-800 text-lg sm:text-lg truncate max-w-[200px] sm:max-w-none">Cadastro de Usuários</h1>
            </div>
            <Button onClick={() => { setEditingId(null); setFormData({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true }); setIsModalOpen(true); }} size="sm" className="whitespace-nowrap">
              <Plus size={16} /> <span className="hidden sm:inline">Novo Usuário</span><span className="sm:hidden">Novo</span>
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou privilégio..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  className="p-3 text-gray-500 font-medium cursor-pointer group select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">Nome <SortIcon columnKey="name" /></div>
                </th>
                <th
                  className="p-3 text-gray-500 font-medium hidden md:table-cell cursor-pointer group select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('privilege')}
                >
                  <div className="flex items-center">Privilégio <SortIcon columnKey="privilege" /></div>
                </th>
                <th className="p-3 text-gray-500 font-medium hidden md:table-cell">Telefone</th>
                <th
                  className="p-3 text-gray-500 font-medium cursor-pointer group select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
                </th>
                <th className="p-3 text-gray-500 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAndSortedParticipants.map(participant => (
                <tr key={participant.id} className="hover:bg-gray-50 border-b last:border-0 cursor-pointer" onClick={() => handleEdit(participant)}>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{participant.name}</div>
                    <div className="text-xs text-gray-500 md:hidden">{PRIVILEGE_OPTIONS.find(o => o.value === participant.type)?.label || participant.type}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded text-xs border ${participant.type === 'ANCIAO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      participant.type === 'SERVO' ? 'bg-green-50 text-green-700 border-green-100' :
                        participant.type === 'PIONEIRO' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                      {PRIVILEGE_OPTIONS.find(o => o.value === participant.type)?.label}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell text-gray-600 text-sm">
                    {participant.phone || '-'}
                  </td>
                  <td className="p-3">
                    <span onClick={(e) => { e.stopPropagation(); toggleActive(participant.id, participant.active); }} className={`cursor-pointer px-2 py-1 rounded text-xs border ${participant.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {participant.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(participant); }} title="Editar">
                        <Edit2 size={16} className="text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(participant.id); }} title="Excluir">
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg">{editingId ? 'Editar Participante' : 'Novo Participante'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nome Completo</label>
                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Privilégio</label>
                  <select
                    className="w-full border rounded p-2 bg-white"
                    value={getUiPrivilege(formData.type)}
                    onChange={(e) => {
                      const newPriv = e.target.value;
                      if (newPriv === 'ANCIAO') setFormData({ ...formData, type: 'ANCIAO', gender: 'PH' });
                      else if (newPriv === 'SERVO') setFormData({ ...formData, type: 'SERVO', gender: 'PH' });
                      else if (newPriv === 'PUBLICADOR') setFormData({ ...formData, type: 'PUB_HOMEM', gender: 'PH' });
                    }}
                  >
                    <option value="ANCIAO">Ancião</option>
                    <option value="SERVO">Servo Ministerial</option>
                    <option value="PUBLICADOR">Publicador</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Gênero</label>
                  <select
                    className={`w-full border rounded p-2 ${getUiPrivilege(formData.type) !== 'PUBLICADOR' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                    value={formData.gender}
                    disabled={getUiPrivilege(formData.type) !== 'PUBLICADOR'}
                    onChange={(e) => {
                      const newGender = e.target.value;
                      const newType = newGender === 'PH' ? 'PUB_HOMEM' : 'PUB_MULHER';
                      setFormData({ ...formData, gender: newGender, type: newType });
                    }}
                  >
                    <option value="PH">Homem (H)</option>
                    <option value="PM">Mulher (M)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Telefone (WhatsApp)</label>
                <input className="w-full border rounded p-2" placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div className="pt-2 border-t mt-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {formData.active && <Check size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <div>
                    <span className="font-medium text-gray-900 block text-sm">Pode receber designações?</span>
                    <span className="text-xs text-gray-500 block">Desmarque para afastar temporariamente</span>
                  </div>
                </label>
              </div>

              {editingId && (
                <div className="pt-2 border-t mt-2">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Histórico Recente</h4>
                  {isLoadingHistory ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
                  ) : history && history.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-sm bg-gray-50 p-2 rounded-lg">
                      {history.map((h: any) => {
                        let roleLabel = 'TITULAR';
                        let roleColor = 'text-blue-600 bg-blue-50';

                        if (h.ajudanteId === editingId) {
                          if (h.parteTemplate?.requerLeitor) {
                            roleLabel = 'LEITOR';
                            roleColor = 'text-purple-600 bg-purple-50';
                          } else {
                            roleLabel = 'AJUDANTE';
                            roleColor = 'text-green-600 bg-green-50';
                          }
                        }

                        // Color Logic relative to NOW
                        const now = new Date();
                        const histDate = new Date(h.semana.dataInicio);

                        const nowMonth = now.getMonth() + now.getFullYear() * 12;
                        const histMonth = histDate.getMonth() + histDate.getFullYear() * 12;
                        const diff = nowMonth - histMonth;

                        let dateFlagClass = "text-gray-500";
                        // Using same colors as Planner for consistency
                        if (histDate > now) {
                          // Future -> Green
                          dateFlagClass = "text-green-600 font-medium";
                        } else if (diff === 0) {
                          // Current Month -> Yellow
                          dateFlagClass = "text-yellow-600 font-medium";
                        } else if (diff === 1) {
                          // Previous Month -> Red
                          dateFlagClass = "text-red-600 font-medium";
                        } else {
                          // Older
                          dateFlagClass = "text-gray-400";
                        }

                        return (
                          <div key={h.id} className="flex justify-between items-center text-xs border-b border-gray-100 last:border-0 pb-1">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700 truncate max-w-[150px]">{h.parteTemplate?.titulo || h.tituloDoTema || 'Designação'}</span>
                              <span className={`text-[10px] px-1 rounded w-fit ${roleColor} font-semibold`}>
                                {roleLabel === 'TITULAR' ? 'TIT' :
                                  roleLabel === 'AJUDANTE' ? 'AJD' :
                                    roleLabel === 'LEITOR' ? 'LEI' : roleLabel}
                              </span>
                            </div>
                            <span className={`${dateFlagClass} whitespace-nowrap`}>
                              {new Date(h.semana.dataInicio).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nenhuma designação encontrada.</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!isDirty}>
                {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete && handleDelete(confirmDelete)} title="Excluir Participante" message="Tem certeza? Isso pode afetar designações existentes." />
    </div>
  );
};
