import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Check, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PRIVILEGE_OPTIONS } from '../../lib/constants';
import { useCreateParticipant, useUpdateParticipant, useDeleteParticipant } from '../../hooks/useParticipants';

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

export const AdminParticipantsView = ({ participants, setParticipants, onBack }: AdminParticipantsViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 sm:ml-0"><ArrowLeft size={20} /></Button>
            <h1 className="font-bold text-gray-800 text-lg sm:text-lg truncate max-w-[200px] sm:max-w-none">Cadastro de Usuários</h1>
          </div>
          <Button onClick={() => { setEditingId(null); setFormData({ name: '', type: 'PUB_HOMEM', gender: 'PH', phone: '', active: true }); setIsModalOpen(true); }} size="sm" className="whitespace-nowrap">
            <Plus size={16} /> <span className="hidden sm:inline">Novo Usuário</span><span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-gray-500 font-medium">Nome</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Privilégio</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Gênero</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-center">Designar</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="px-2 py-1 rounded bg-gray-100 border text-xs">{PRIVILEGE_OPTIONS.find(o => o.value === p.type)?.label || p.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.gender === 'PH' ? 'H' : 'M'}</td>
                  <td className="px-6 py-4 text-center">
                    {p.active !== false ?
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><Check size={12} /> Sim</span> :
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold"><Ban size={12} /> Não</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => setConfirmDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete && handleDelete(confirmDelete)} title="Excluir Participante" message="Tem certeza? Isso pode afetar designações existentes." />
    </div>
  );
};
