import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const ChangePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/users/change-password', { password });

      // Show success UI
      setSuccess(true);

      // Logout and redirect after a short delay
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Failed to change password', err);
      setError(err.response?.data?.message || 'Erro ao alterar senha. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="mb-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto h-24 w-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20 transform rotate-3">
            <Lock size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Senha Alterada!</h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-6 border border-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" strokeWidth={2.5} />
            </div>
            <p className="text-gray-600 mb-2">
              Sua senha foi atualizada com sucesso.
            </p>
            <p className="text-sm text-gray-400">
              Redirecionando para o login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">

      {/* Brand / Logo Area */}
      <div className="mb-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto h-24 w-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20 transform rotate-3">
          <Lock size={40} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Alterar Senha</h1>
        <p className="text-gray-500 mt-2 text-sm">Por segurança, altere sua senha no primeiro acesso</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium text-center animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/30 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/30 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 h-12 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              Cancelar e Sair
              </button>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-400">
            JW Planner © {new Date().getFullYear()}
          </p>
          <p className="text-[10px] text-gray-300 font-medium">
            Made within Antigravity by Alex Vidotto
          </p>
        </div>
      </div>
    </div>
  );
};
