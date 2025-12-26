import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Copy, Shield, Check, Key, Search, X, Trash2, Info } from 'lucide-react';

export const AdminUsersPage = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  /* const [loading, setLoading] = useState(true); */
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [confirmingUser, setConfirmingUser] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      await api.put(`/users/${editingUser.id}`, {
        nome: editingUser.nome,
        role: editingUser.role
      });

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, nome: editingUser.nome, role: editingUser.role } : u));
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user', error);
      alert('Erro ao atualizar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initCredentialGeneration = (user: any) => {
    setConfirmingUser(user);
  };

  const confirmCredentialGeneration = async () => {
    if (!confirmingUser) return;
    const user = confirmingUser;
    setIsSubmitting(true);

    try {
      const response = await api.post(`/users/${user.id}/credentials`, {});
      setCreatedCredentials({
        email: response.data.email,
        password: response.data.password
      });
      // Update local user to mark as having auth
      setUsers(users.map(u => u.id === user.id ? { ...u, uidAuth: 'linked-now', email: response.data.email } : u));
      setConfirmingUser(null);
      // We don't close the link modal immediately, we let them see the success message
      // But maybe we should close the link modal?
      // Let's keep the credentials visible.
    } catch (error: any) {
      console.error('Failed to generate credentials', error);
      alert('Erro ao gerar credenciais: ' + (error.response?.data?.message || 'Erro desconhecido'));
      setConfirmingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeUsers = users.filter(u => u.uidAuth);
  const pendingUsers = users.filter(u => !u.uidAuth && u.email && u.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const confirmResetPassword = async () => {
    if (!confirmingUser) return;
    const user = confirmingUser;
    setIsSubmitting(true);

    try {
      const response = await api.post(`/users/${user.id}/reset-password`, {});
      setCreatedCredentials({
        email: response.data.email,
        password: response.data.password
      });
      setConfirmingUser(null);
      setEditingUser(null); // Close the edit modal so the user can see the credentials banner
      // Ensure specific modal is closed if any (we reuse confirmingUser for both)
    } catch (error: any) {
      console.error('Failed to reset password', error);
      alert('Erro ao redefinir senha: ' + (error.response?.data?.message || 'Erro desconhecido'));
      setConfirmingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!confirmingUser) return;
    const user = confirmingUser;
    setIsSubmitting(true);

    try {
      await api.delete(`/users/${user.id}`);
      setUsers(users.filter(u => u.id !== user.id));
      setConfirmingUser(null);
    } catch (error: any) {
      console.error('Failed to delete user', error);
      alert('Erro ao excluir usuário: ' + (error.response?.data?.message || 'Erro desconhecido'));
      setConfirmingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto relative min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-600" size={20} />
          <h1 className="text-xl font-bold text-gray-800">
            Acessos
          </h1>
        </div>
        <button
          onClick={() => { setIsLinkModalOpen(true); setCreatedCredentials(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-sm font-medium text-sm"
        >
          <UserPlus size={16} />
          <span>Adicionar</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-blue-800">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>Apenas usuários com email cadastrado podem receber acesso.</p>
      </div>

      {/* Success Message Banner (Global) */}
      {createdCredentials && !isLinkModalOpen && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-start animate-in fade-in slide-in-from-top-2">
          <div>
            <h3 className="text-sm font-bold text-green-800 mb-1">Credenciais Geradas com Sucesso!</h3>
            <div className="text-sm text-green-700">
              <p>Email: {createdCredentials.email}</p>
              <p>Senha: {createdCredentials.password}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 px-3 py-1 bg-white border border-green-200 rounded text-sm font-medium text-green-700 hover:bg-green-50"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={() => setCreatedCredentials(null)} className="text-green-600 hover:text-green-800">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Active Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[40%]">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeUsers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    Nenhum usuário ativo encontrado.
                  </td>
                </tr>
              ) : activeUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => setEditingUser(user)}>
                  <td className="px-6 py-5 text-gray-900 font-medium align-middle">
                    <div className="flex items-center justify-between">
                      <span>{user.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-500 text-sm align-middle max-w-[150px] truncate">
                    {user.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link User Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Vincular Participante Existente</h2>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {createdCredentials ? (
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Check className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-green-800 mb-2">Acesso Gerado!</h3>
                <p className="text-green-700 mb-4">
                  As credenciais abaixo foram geradas para o usuário. Copie-as agora.
                </p>
                <div className="bg-white p-4 rounded border border-green-200 w-full mb-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-mono font-medium text-gray-900 mb-2">{createdCredentials.email}</p>
                  <p className="text-sm text-gray-500">Senha</p>
                  <p className="font-mono font-medium text-gray-900">{createdCredentials.password}</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={() => { setCreatedCredentials(null); setIsLinkModalOpen(false); }}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar participante..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                  <div className="overflow-y-auto flex-1 border border-gray-100 rounded-lg max-h-[400px]">
                  {pendingUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Nenhum participante disponível para vínculo.
                    </div>
                  ) : (
                        <ul className="divide-y divide-gray-100">
                          {pendingUsers.map(user => (
                            <li key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                              <div className="min-w-0 flex-1 mr-4">
                                <div className="font-medium text-gray-900 truncate">{user.nome}</div>
                                {user.email && (
                                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                )}
                              </div>
                              <button
                                onClick={() => initCredentialGeneration(user)}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                              >
                                <Key size={14} />
                                Gerar
                              </button>
                            </li>
                          ))}
                        </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {
        editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Editar Usuário</h2>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editingUser.nome}
                    onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Função (Role)</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="USER">User (Padrão)</option>
                    <option value="ASSISTENTE">Assistente</option>
                    <option value="PRESIDENTE">Presidente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleUpdateUser}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>

                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setConfirmingUser({ ...editingUser, action: 'RESET' })}
                    className="flex-1 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <Key size={14} /> Redefinir Senha
                  </button>
                  {userProfile?.id !== editingUser.id && (
                    <button
                      onClick={() => setConfirmingUser({ ...editingUser, action: 'DELETE' })}
                      className="flex-1 py-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Confirmation Modal */}
      {confirmingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmingUser.action === 'RESET' ? 'Redefinir Senha?' :
                confirmingUser.action === 'DELETE' ? 'Excluir Usuário?' : 'Confirmar Acesso'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              {confirmingUser.action === 'RESET'
                ? `Isso irá invalidar a senha atual de ${confirmingUser.nome} e gerar uma nova.`
                : confirmingUser.action === 'DELETE'
                  ? `Tem certeza que deseja excluir ${confirmingUser.nome}? Essa ação não pode ser desfeita.`
                : `Gerar credenciais para ${confirmingUser.nome}?`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmingUser(null)}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting}
                onClick={confirmingUser.action === 'RESET' ? confirmResetPassword :
                  confirmingUser.action === 'DELETE' ? confirmDeleteUser : confirmCredentialGeneration}
                className={`px-3 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(confirmingUser.action === 'RESET' || confirmingUser.action === 'DELETE') ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isSubmitting ? 'Processando...' : (
                  confirmingUser.action === 'RESET' ? 'Redefinir' :
                    confirmingUser.action === 'DELETE' ? 'Excluir' : 'Sim, Gerar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
