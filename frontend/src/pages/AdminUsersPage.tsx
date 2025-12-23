import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserPlus, Copy, Shield, Check, Key } from 'lucide-react';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ nome: '', email: '', role: 'USER' as const });
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [creating, setCreating] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreatedCredentials(null);
    try {
      const response = await api.post('/users', {
        nome: newUser.nome,
        email: newUser.email,
        role: newUser.role,
        privilegio: 'PUB_HOMEM', // Default
        podeDesignar: true,
      });

      setUsers([...users, response.data.user]);
      setCreatedCredentials({
        email: newUser.email,
        password: response.data.password,
      });
      setNewUser({ nome: '', email: '', role: 'USER' });
    } catch (error) {
      console.error('Failed to create user', error);
      alert('Erro ao criar usuário');
    } finally {
      setCreating(false);
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
      // Update local user 
      setUsers(users.map(u => u.id === user.id ? { ...u, uidAuth: 'linked-now' } : u));
      setConfirmingUser(null);
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

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600" />
          Gerenciar Usuários
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus size={20} />
            Novo Usuário
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newUser.nome}
                onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Função (Role)</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={newUser.role}
                onChange={(e: any) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="USER">Publicador (Sem acesso especial)</option>
                <option value="ASSISTENTE">Assistente (Rastreio + Status)</option>
                <option value="PRESIDENTE">Presidente (Relatórios + Rastreio)</option>
                <option value="ADMIN">Administrador (Total)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {creating ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>

          {createdCredentials && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-bold text-green-800 mb-2">Usuário Criado com Sucesso!</h3>
              <div className="text-sm text-green-700 space-y-1 break-all">
                <p>Email: {createdCredentials.email}</p>
                <p>Senha: {createdCredentials.password}</p>
              </div>
              <button
                onClick={copyToClipboard}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar Credenciais'}
              </button>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                {users.map((user) => (
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
                          {!user.uidAuth && (
                            <button
                              onClick={() => initCredentialGeneration(user)}
                              className="text-amber-600 hover:text-amber-800"
                              title="Gerar Credenciais de Acesso"
                            >
                              <Key size={18} />
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
      </div>

      {/* Confirmation Modal */}
      {confirmingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gerar Credenciais?</h3>
            <p className="text-gray-600 mb-6">
              Você está prestes a gerar uma senha de acesso para <strong>{confirmingUser.nome}</strong>.
              Isso permitirá que eles façam login no sistema.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmingUser(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCredentialGeneration}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Gerar Senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
