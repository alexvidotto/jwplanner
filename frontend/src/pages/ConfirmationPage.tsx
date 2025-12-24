
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Check, X, Clock, User, AlertCircle, MoreVertical, RotateCcw, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

interface Assignment {
  id: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO';
  statusAjudante?: 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO';
  parteTemplate: {
    titulo: string;
    secao: string;
    requerLeitor: boolean;
  };
  semana: {
    dataInicio: string;
    descricao: string;
  };
  titular?: { nome: string; id: string };
  ajudante?: { nome: string; id: string };
  observacao?: string;
  tempo?: number;
  tituloDoTema?: string;
}


export const ConfirmationPage = () => {
  const { assignmentId, personId } = useParams();
  /* const navigate = useNavigate(); */
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'CONFIRMADO' | 'RECUSADO' | 'PENDENTE' | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      // Use configured API client (proxied via /api)
      const response = await api.get(`/planning/assignments/${assignmentId}`);
      setAssignment(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Designação não encontrada ou link inválido.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE') => {
    if (!assignmentId) return;
    setActionLoading(true);
    setProcessingStatus(status);
    try {
      await api.patch(`/planning/assignments/${assignmentId}/status`, {
        status,
        personId
      });

      await fetchAssignment();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setActionLoading(false);
      setProcessingStatus(null);
      setShowMenu(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-sm w-full text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Link Inválido</h3>
          <p className="text-gray-500 mb-4">{error || 'Não foi possível carregar a designação.'}</p>
        </div>
      </div>
    );
  }

  const date = new Date(assignment.semana.dataInicio);
  const dateFormatted = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  const requiresReader = assignment.parteTemplate.requerLeitor;

  // Role Determination
  let viewerRole = 'TITULAR';
  let myName = '';

  if (personId) {
    if (assignment.titular?.id === personId) {
      viewerRole = 'TITULAR';
      myName = assignment.titular.nome;
    } else if (assignment.ajudante?.id === personId) {
      // If it requires a reader, this person is the reader
      viewerRole = requiresReader ? 'LEITOR' : 'AJUDANTE';
      myName = assignment.ajudante.nome;
    }
  }

  // Refine role for special parts
  if (assignment.parteTemplate.titulo === 'Presidente') viewerRole = 'PRESIDENTE';
  if (assignment.parteTemplate.titulo === 'Oração Inicial') viewerRole = 'ORAÇÃO';

  // Determine status based on role
  let myStatus = assignment.status;
  if (viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') {
    myStatus = assignment.statusAjudante || 'PENDENTE'; // Fallback if not yet populated
  } else if (viewerRole === 'TITULAR') {
    myStatus = assignment.status;
  }
  // For President/Prayer, it might still map to assignment.status if it's a virtual/special map, 
  // OR we might need to handle them if they are using real assignments now.
  // The backend findAssignmentById for virtual parts returns a constructed object where .status is populated correctly.

  const isConfirmed = myStatus === 'CONFIRMADO';
  const isDeclined = myStatus === 'RECUSADO';




  // Theme Configuration based on Role
  const theme = {
    TITULAR: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
    },
    AJUDANTE: {
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
    },
    LEITOR: {
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-600',
    },
    PRESIDENTE: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
    },
    ORAÇÃO: {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
    DEFAULT: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
    }
  };

  const currentTheme = theme[viewerRole as keyof typeof theme] || theme.DEFAULT;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative">
        {/* Top Right Menu */}
        {!isDeclined && !isConfirmed && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-gray-100 rounded-lg overflow-hidden min-w-[160px]">
                <button
                  onClick={() => updateStatus('RECUSADO')}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <X size={16} />
                  Informar Ausência ({myName || 'Você'})
                </button>
              </div>
            )}
          </div>
        )}
        {/* Header */}
        <div className={`p-6 text-center ${isConfirmed ? 'bg-green-50' : isDeclined ? 'bg-red-50' : currentTheme.bg}`}>
          <div className="mb-4 flex justify-center">
            {isConfirmed ? (
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            ) : isDeclined ? (
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-8 w-8 text-red-600" />
              </div>
            ) : (
              <div className={`h-16 w-16 ${currentTheme.iconBg} rounded-full flex items-center justify-center`}>
                <User className={`h-8 w-8 ${currentTheme.iconText}`} />
              </div>
            )}
          </div>

          {myName && <p className="text-sm font-medium text-gray-500 mb-1">Olá, {myName}</p>}

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isConfirmed ? 'Confirmado!' : isDeclined ? 'Ausência Informada' : 'Sua Designação'}
          </h1>
          <p className="text-gray-600">
            {isConfirmed ? 'Obrigado por confirmar sua parte.' : isDeclined ? 'Obrigado por nos avisar.' : 'Confirme os detalhes abaixo.'}
          </p>
        </div>

        {/* Details Card */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Data</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{dateFormatted}</p>
              <p className="text-xs text-gray-500">{assignment.semana.descricao}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Parte</p>
              <p className="text-sm font-medium text-gray-900">{assignment.parteTemplate.titulo}</p>
              {assignment.tituloDoTema && assignment.tituloDoTema !== assignment.parteTemplate.titulo && (
                <p className="text-xs text-gray-600 mt-1 italic">"{assignment.tituloDoTema}"</p>
              )}
            </div>
          </div>

          {/* Specialized Participants Card for Student Parts */}
          {assignment.ajudante && (
            <div className={`rounded-lg border overflow-hidden ${requiresReader ? 'bg-rose-50 border-rose-100' : 'bg-yellow-50 border-yellow-100'}`}>
              <div className={`px-4 py-2 flex items-center gap-2 ${requiresReader ? 'bg-rose-100' : 'bg-yellow-100'}`}>
                <Users className={requiresReader ? 'text-rose-700' : 'text-yellow-700'} size={16} />
                <span className={`text-xs font-bold uppercase tracking-wide ${requiresReader ? 'text-rose-800' : 'text-yellow-800'}`}>Participantes</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-row items-center gap-2">
                    <span className={`text-sm font-medium ${requiresReader ? 'text-rose-900' : 'text-yellow-900'}`}>Titular</span>
                    {viewerRole === 'TITULAR' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit font-bold ${requiresReader ? 'bg-rose-200 text-rose-800' : 'bg-yellow-200 text-yellow-800'}`}>VOCÊ</span>
                    )}
                  </div>
                  <span className={`text-sm ${viewerRole === 'TITULAR' ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                    {assignment.titular?.nome || '-'}
                  </span>
                </div>
                {assignment.ajudante && (
                  <>
                    <div className={`h-px ${requiresReader ? 'bg-rose-100' : 'bg-yellow-100'}`} />
                    <div className="flex justify-between items-center">
                      <div className="flex flex-row items-center gap-2">
                        <span className={`text-sm font-medium ${requiresReader ? 'text-rose-900' : 'text-yellow-900'}`}>
                          {requiresReader ? 'Leitor' : 'Ajudante'}
                        </span>
                        {(viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit font-bold ${requiresReader ? 'bg-rose-200 text-rose-800' : 'bg-yellow-200 text-yellow-800'}`}>VOCÊ</span>
                        )}
                      </div>
                      <span className={`text-sm ${(viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                        {assignment.ajudante.nome}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}


          {assignment.tempo && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="text-gray-400" size={20} />
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Tempo</p>
                <p className="text-sm font-medium text-gray-900">{assignment.tempo} min</p>
              </div>
            </div>
          )}

          {assignment.observacao && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <AlertCircle className="text-yellow-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs text-yellow-700 uppercase font-bold">Observação</p>
                <p className="text-sm text-yellow-800">{assignment.observacao}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex flex-col gap-3">
          {!isConfirmed && !isDeclined && (
            <Button
              onClick={() => updateStatus('CONFIRMADO')}
              disabled={actionLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
            >
              {actionLoading
                ? (processingStatus === 'RECUSADO' ? 'Informando ausência...' : 'Confirmando...')
                : 'Confirmar'
              }
            </Button>
          )}

          <div className="flex justify-center items-center gap-4 mt-2">
            {(isConfirmed || isDeclined) && (
              <button
                onClick={() => updateStatus('PENDENTE')}
                disabled={actionLoading}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 underline decoration-gray-300"
              >
                <RotateCcw size={14} />
                Desfazer {isConfirmed ? 'confirmação' : 'ação'}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        JW Planner &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
};
