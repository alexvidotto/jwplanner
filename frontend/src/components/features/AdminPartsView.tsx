import { useState, useMemo as useMemo2 } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Book, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useCreatePart, useUpdatePart, useDeletePart, usePartHistory } from '../../hooks/useParts';
import { Loader2 } from 'lucide-react';

interface PartTemplate {
  id: string;
  title: string;
  defaultTime: string; // '5 min'
  section: string; // 'tesouros' | 'fsm' | 'nvc'
  requiresAssistant?: boolean;
  requiresReader?: boolean;
  hasObservation?: boolean;
  hasTime?: boolean;
}

interface AdminPartsViewProps {
  parts: PartTemplate[];
  setParts: (parts: PartTemplate[]) => void;
  onBack: () => void;
}

export const AdminPartsView = ({ parts, onBack }: AdminPartsViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: history, isLoading: isLoadingHistory } = usePartHistory(editingId);
  const [formData, setFormData] = useState({ title: '', defaultTime: '5 min', section: 'fsm', requiresAssistant: false, requiresReader: false, hasObservation: false, hasTime: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PartTemplate; direction: 'asc' | 'desc' } | null>(null);

  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const deletePart = useDeletePart();

  const handleSave = async () => {
    if (!formData.title) return;

    try {
      const timeInt = parseInt(formData.defaultTime.replace(/\D/g, '')) || 5;

      const payload = {
        titulo: formData.title,
        secao: formData.section,
        tempoPadrao: timeInt,
        requerAjudante: formData.requiresAssistant,
        requerLeitor: formData.requiresReader,
        temObservacao: formData.hasObservation,
        temTempo: formData.hasTime,
      };

      if (editingId) {
        await updatePart.mutateAsync({ id: editingId, ...payload });
      } else {
        await createPart.mutateAsync(payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: '', defaultTime: '5 min', section: 'fsm', requiresAssistant: false, requiresReader: false, hasObservation: false, hasTime: false });
    } catch (error) {
      console.error('Failed to save part:', error);
      alert('Erro ao salvar parte.');
    }
  };

  const handleEdit = (p: PartTemplate) => {
    setEditingId(p.id);
    setFormData({ title: p.title, defaultTime: p.defaultTime, section: p.section, requiresAssistant: p.requiresAssistant || false, requiresReader: p.requiresReader || false, hasObservation: p.hasObservation || false, hasTime: p.hasTime ?? true });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePart.mutateAsync(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete part:', error);
      alert('Erro ao excluir parte.');
    }
  };

  const isDirty = useMemo2(() => {
    if (!editingId) return !!formData.title;
    const original = parts.find(p => p.id === editingId);
    if (!original) return false;
    // Compare fields
    const timeInt = parseInt(formData.defaultTime.replace(/\D/g, '')) || 5;
    const origTimeInt = parseInt((original.defaultTime || '5').replace(/\D/g, '')) || 5;

    return (
      formData.title !== original.title ||
      formData.section !== original.section ||
      timeInt !== origTimeInt ||
      formData.requiresAssistant !== (original.requiresAssistant || false) ||
      formData.requiresReader !== (original.requiresReader || false) ||
      formData.hasObservation !== (original.hasObservation || false) ||
      formData.hasTime !== (original.hasTime ?? true)
    );
  }, [formData, editingId, parts]);

  const handleSort = (key: keyof PartTemplate) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedParts = useMemo2(() => {
    let result = [...parts];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(lowerTerm) ||
        p.section.toLowerCase().includes(lowerTerm)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Handle potentially undefined/missing values if necessary, though strict type suggests they exist
        // For strings compare via localeCompare for better accuracy
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [parts, searchTerm, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-400 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
              <h1 className="font-bold text-gray-800 text-lg">Cadastro de Partes</h1>
            </div>
            <Button onClick={() => { setEditingId(null); setFormData({ title: '', defaultTime: '5 min', section: 'fsm', requiresAssistant: false, requiresReader: false, hasObservation: false, hasTime: false }); setIsModalOpen(true); }}>
              <Plus size={16} /> Nova Parte
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por título ou seção..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  className="px-6 py-3 text-gray-500 font-medium cursor-pointer group select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">Título <SortIcon columnKey="title" /></div>
                </th>
                <th
                  className="px-6 py-3 text-gray-500 font-medium cursor-pointer group select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('section')}
                >
                  <div className="flex items-center">Seção <SortIcon columnKey="section" /></div>
                </th>
                <th
                  className="px-6 py-3 text-gray-500 font-medium cursor-pointer group select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('defaultTime')}
                >
                  <div className="flex items-center">Tempo Padrão <SortIcon columnKey="defaultTime" /></div>
                </th>
                <th className="px-6 py-3 text-gray-500 font-medium">Ajudante?</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Leitor?</th>
                <th className="px-6 py-3 text-gray-500 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAndSortedParts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(p)}>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                  <td className="px-6 py-4 text-gray-600 uppercase text-xs">{p.section}</td>
                  <td className="px-6 py-4 text-gray-600">{p.hasTime !== false ? p.defaultTime : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{p.requiresAssistant ? 'Sim' : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{p.requiresReader ? <span className="text-blue-600 font-bold flex items-center gap-1"><Book size={14} /> Sim</span> : '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
            <h3 className="font-bold text-lg">{editingId ? 'Editar Parte' : 'Nova Parte'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Título da Parte</label>
                <input className="w-full border rounded p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Estudo Bíblico" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Seção</label>
                <select className="w-full border rounded p-2 bg-white" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
                  <option value="geral">Reunião / Geral</option>
                  <option value="tesouros">Tesouros da Palavra</option>
                  <option value="fsm">Faça Seu Melhor</option>
                  <option value="nvc">Nossa Vida Cristã</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={formData.hasTime} onChange={e => setFormData({ ...formData, hasTime: e.target.checked })} />
                    <span className="text-sm text-gray-800">Add tempo</span>
                  </label>
                  {formData.hasTime && (
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Tempo Padrão</label>
                      <input className="w-full border rounded p-2" value={formData.defaultTime} onChange={e => setFormData({ ...formData, defaultTime: e.target.value })} placeholder="Ex: 5 min" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col pt-6 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.requiresAssistant} onChange={e => setFormData({ ...formData, requiresAssistant: e.target.checked })} />
                    <span className="text-sm text-gray-800">Requer Ajudante</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.requiresReader} onChange={e => setFormData({ ...formData, requiresReader: e.target.checked })} />
                    <span className="text-sm text-gray-800">Requer Leitor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.hasObservation} onChange={e => setFormData({ ...formData, hasObservation: e.target.checked })} />
                    <span className="text-sm text-gray-800">Permitir observação</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-2">Histórico Recente</h4>
                {isLoadingHistory ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                      {history && history.filter((h: any) => h.titular).length > 0 ? (
                        history.filter((h: any) => h.titular).map((h: any, i: number) => (
                        <div key={i} className="text-sm bg-gray-50 p-2 rounded flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-800">{h.titular?.nome}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(h.semana.dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          {h.ajudante && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <span className={`font-semibold ${h.parteTemplate?.requerLeitor ? 'text-purple-600' : 'text-green-600'}`}>
                                {h.parteTemplate?.requerLeitor ? 'Leitor:' : 'Ajudante:'}
                              </span>
                              <span>{h.ajudante.nome}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma designação encontrada.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!isDirty}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete && handleDelete(confirmDelete)} title="Excluir Parte Template" message="Isso não removerá designações já criadas na grade, apenas a opção de criar novas." />
    </div>
  );
};
