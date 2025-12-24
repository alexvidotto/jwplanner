import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Copy, Shield, Check, Key, Search, X, Trash2 } from 'lucide-react';

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
    }
  };

  const initCredentialGeneration = (user: any) => {
    setConfirmingUser(user);
  };

  const confirmCredentialGeneration = async () => {
    if (!confirmingUser) return;
    const user = confirmingUser;

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
  const pendingUsers = users.filter(u => !u.uidAuth && u.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const confirmResetPassword = async () => {
    if (!confirmingUser) return;
    const user = confirmingUser;

    try {
      const response = await api.post(`/users/${user.id}/reset-password`, {});
      setCreatedCredentials({
        email: response.data.email,
        password: response.data.password
      });
      setConfirmingUser(null);
      // Ensure specific modal is closed if any (we reuse confirmingUser for both)
    } catch (error: any) {
      console.error('Failed to reset password', error);
      alert('Erro ao redefinir senha: ' + (error.response?.data?.message || 'Erro desconhecido'));
      setConfirmingUser(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!confirmingUser) return;
    const user = confirmingUser;

    try {
      await api.delete(`/users/${user.id}`);
      setUsers(users.filter(u => u.id !== user.id));
      setConfirmingUser(null);
    } catch (error: any) {
      console.error('Failed to delete user', error);
      alert('Erro ao excluir usuário: ' + (error.response?.data?.message || 'Erro desconhecido'));
      setConfirmingUser(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600" />
          Gerenciar Usuários
        </h1>
        <button
          onClick={() => { setIsLinkModalOpen(true); setCreatedCredentials(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Adicionar Usuário
        </button>
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum usuário ativo encontrado. Adicione um clicando no botão acima.
                  </td>
                </tr>
              ) : activeUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingUser?.id === user.id ? (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editingUser.nome}
                        onChange={e => setEditingUser({ ...editingUser, nome: e.target.value })}
                      />
                    ) : user.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUser?.id === user.id ? (
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={editingUser.role}
                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="USER">User</option>
                        <option value="ASSISTENTE">Assistente</option>
                        <option value="PRESIDENTE">Presidente</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'PRESIDENTE' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'ASSISTENTE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role || 'USER'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUser?.id === user.id ? (
                      <div className="flex gap-2">
                        <button onClick={handleUpdateUser} className="text-green-600 hover:text-green-800 font-medium">Salvar</button>
                        <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                        <button
                          onClick={() => setConfirmingUser({ ...user, action: 'RESET' })}
                          className="text-gray-500 hover:text-red-600"
                          title="Redefinir Senha"
                        >
                          <Key size={18} />
                        </button>
                          {userProfile?.id !== user.id && (
                            <button
                              onClick={() => setConfirmingUser({ ...user, action: 'DELETE' })}
                              className="text-gray-400 hover:text-red-600"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                      </div>
                    )}
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

                <div className="overflow-y-auto flex-1 border border-gray-100 rounded-lg">
                  {pendingUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Nenhum participante disponível para vínculo.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email Atual</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[150px]">{user.email || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => initCredentialGeneration(user)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100"
                              >
                                <Key size={14} />
                                Gerar Acesso
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
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
                onClick={confirmingUser.action === 'RESET' ? confirmResetPassword :
                  confirmingUser.action === 'DELETE' ? confirmDeleteUser : confirmCredentialGeneration}
                className={`px-3 py-2 text-sm text-white rounded-lg font-medium ${(confirmingUser.action === 'RESET' || confirmingUser.action === 'DELETE') ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {confirmingUser.action === 'RESET' ? 'Redefinir' :
                  confirmingUser.action === 'DELETE' ? 'Excluir' : 'Sim, Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
