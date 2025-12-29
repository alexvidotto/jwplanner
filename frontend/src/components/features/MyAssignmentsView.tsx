import { useEffect, useState } from 'react';
import { Check, X, User, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface MyAssignment {
  id: string;
  date: string;
  weekDescription: string;
  partTitle: string;
  themeTitle?: string;
  role: 'TITULAR' | 'AJUDANTE' | 'LEITOR' | 'PRESIDENTE' | 'ORAÇÃO';
  status: 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO';
  observations?: string;
  partner?: string;
  partnerRole?: string;
  time?: number;
}

export const MyAssignmentsView = () => {
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planning/assignments/my-assignments');
      setAssignments(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar designações.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (assignmentId: string, newStatus: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE') => {
    const previousAssignments = [...assignments];
    setAssignments(prev => prev.map(a =>
      a.id === assignmentId ? { ...a, status: newStatus } : a
    ));

    try {
      await api.patch(`/planning/assignments/${assignmentId}/status`, {
        status: newStatus
      });
    } catch (err) {
      console.error(err);
      setAssignments(previousAssignments);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'TITULAR': return 'bg-blue-100/50 text-blue-700 border-blue-200';
      case 'AJUDANTE': return 'bg-amber-100/50 text-amber-700 border-amber-200';
      case 'LEITOR': return 'bg-purple-100/50 text-purple-700 border-purple-200';
      case 'PRESIDENTE': return 'bg-indigo-100/50 text-indigo-700 border-indigo-200';
      case 'ORAÇÃO': return 'bg-teal-100/50 text-teal-700 border-teal-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Carregando designações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 max-w-md mx-auto">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ops, algo deu errado</h3>
        <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
        <Button onClick={fetchAssignments} className="w-full h-12 text-base shadow-lg shadow-blue-200/50">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Designações</h1>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200">
          {assignments.length} Futuras
        </span>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 px-6">
          <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-500" strokeWidth={3} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tudo em dia!</h3>
          <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">
            Você não tem designações pendentes para as próximas semanas. Aproveite o descanso!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment, index) => {
            const isPending = assignment.status === 'PENDENTE';
            const isConfirmed = assignment.status === 'CONFIRMADO';
            const isRefused = assignment.status === 'RECUSADO';

            const dateObj = new Date(assignment.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
            const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

            return (
              <div
                key={assignment.id}
                className={`relative bg-white rounded-2xl p-4 md:p-5 shadow-sm border transition-all duration-300 hover:shadow-md group
                  ${isConfirmed ? 'border-green-200 shadow-green-100/30' : 'border-gray-100 shadow-gray-100'}
                  ${isRefused ? 'opacity-75 bg-gray-50' : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Status Indicator Line */}
                <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full
                  ${isConfirmed ? 'bg-green-500' : isRefused ? 'bg-red-400' : 'bg-blue-500'}
                `} />

                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Column: Date */}
                  <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[70px]">
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border 
                      ${isConfirmed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-white border-gray-100 text-gray-900'}
                    `}>
                      <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">{month}</span>
                      <span className="text-xl font-black leading-none tracking-tighter">{day}</span>
                    </div>
                    <div className="md:hidden">
                      <p className="font-bold text-gray-900 text-sm">{assignment.weekDescription}</p>
                      <p className="text-xs text-gray-500 capitalize">{weekday}</p>
                    </div>
                  </div>

                  {/* Right Column: Content */}
                  <div className="flex-1 space-y-3">
                    {/* Meta Header */}
                    <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 border-b border-gray-50 pb-2">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="font-medium">{assignment.weekDescription}</span>
                      <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                      <span className="capitalize">{weekday}</span>
                    </div>

                    {/* Main Title & Role */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(assignment.role)}`}>
                          {assignment.role}
                        </span>
                        {assignment.time && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                            <Clock size={10} /> {assignment.time} min
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                        {assignment.partTitle}
                      </h2>
                      {assignment.themeTitle && assignment.themeTitle !== assignment.partTitle && (
                        <p className="text-gray-600 mt-0.5 italic text-sm">"{assignment.themeTitle}"</p>
                      )}
                    </div>

                    {/* Partner Card */}
                    {assignment.partner && (
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100/50 max-w-sm">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-100 text-gray-400 shadow-sm">
                          <User size={12} />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">{assignment.partnerRole}</span>
                          <span className="font-semibold text-gray-800 text-xs">{assignment.partner}</span>
                        </div>
                      </div>
                    )}

                    {/* Observations */}
                    {assignment.observations && (
                      <div className="bg-yellow-50/70 p-3 rounded-lg border border-yellow-100 text-yellow-900/80 text-xs leading-relaxed relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-300/50" />
                        <div className="font-medium">
                          {(() => {
                            const text = assignment.observations;
                            if (!text) return null;
                            const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
                            return parts.map((part, index) => {
                              const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                              if (match) {
                                return (
                                  <a
                                    key={index}
                                    href={match[2]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2"
                                  >
                                    {match[1]}
                                  </a>
                                );
                              }
                              return part;
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Actions Area */}
                    <div className="pt-2">
                      {isPending ? (
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => updateStatus(assignment.id, 'CONFIRMADO')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-lg text-sm font-bold shadow-md shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-[0.98]"
                          >
                            <Check size={16} className="mr-1.5" strokeWidth={3} />
                            Confirmar
                          </Button>
                          <button
                            onClick={() => updateStatus(assignment.id, 'RECUSADO')}
                            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors whitespace-nowrap"
                          >
                            Não poderei
                          </button>
                        </div>
                      ) : (
                          <div className="w-full flex items-center justify-between bg-gray-50 rounded-lg p-1.5 pl-3 border border-gray-100">
                            <div className="flex items-center gap-2">
                              {isConfirmed ? (
                                <div className="flex items-center gap-1.5 text-green-700 font-bold text-sm">
                                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                  Confirmado
                                </div>
                              ) : (
                                  <div className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                      <X size={12} strokeWidth={3} />
                                    </div>
                                  Ausência
                                </div>
                              )}
                          </div>
                          <button
                            onClick={() => updateStatus(assignment.id, 'PENDENTE')}
                              className="text-[10px] font-semibold text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-white transition-all border border-transparent hover:border-gray-100"
                          >
                            Desfazer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );


          })}
        </div>
      )}
    </div>
  );
};
