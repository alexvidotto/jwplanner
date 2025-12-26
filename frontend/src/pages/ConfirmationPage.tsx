
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Check, X, User, AlertCircle, RotateCcw } from 'lucide-react';
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

  // Role Determination
  let viewerRole = 'TITULAR';
  let myName = '';

  if (assignment && personId) {
    if (assignment.titular?.id === personId) {
      viewerRole = 'TITULAR';
      myName = assignment.titular.nome;
    } else if (assignment.ajudante?.id === personId) {
      viewerRole = assignment.parteTemplate.requerLeitor ? 'LEITOR' : 'AJUDANTE';
      myName = assignment.ajudante.nome;
    }
  }

  // Refine role for special parts
  if (assignment && assignment.parteTemplate.titulo === 'Presidente') viewerRole = 'PRESIDENTE';
  if (assignment && assignment.parteTemplate.titulo === 'Oração Inicial') viewerRole = 'ORAÇÃO';

  const updateStatus = async (newStatus: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE') => {
    if (!assignmentId || !assignment) return;

    // 1. Optimistic Update
    const previousAssignment = { ...assignment };
    const updatedAssignment = { ...assignment };

    if (viewerRole === 'TITULAR' || viewerRole === 'PRESIDENTE' || viewerRole === 'ORAÇÃO') {
      updatedAssignment.status = newStatus;
    } else {
      updatedAssignment.statusAjudante = newStatus;
    }

    // Apply optimistic state
    setAssignment(updatedAssignment);

    // If confirming/declining, we don't need a loading spinner on the button because the UI will change state immediately
    if (newStatus === 'PENDENTE') {
      // Only show spinner if undoing, maybe? Or just rely on optimistic too.
      // Let's rely on optimistic for everything.
    }

    try {
      await api.patch(`/planning/assignments/${assignmentId}/status`, {
        status: newStatus,
        personId
      });
      // Optionally re-fetch to ensure data consistency, but usually not strictly needed if patch is robust.
      // We will perform a silent re-fetch just in case.
      fetchAssignment();
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setAssignment(previousAssignment);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      // Cleanup if needed
    }
  };

  const isConfirmed = assignment ? (
    (viewerRole === 'TITULAR' || viewerRole === 'PRESIDENTE' || viewerRole === 'ORAÇÃO')
      ? assignment.status === 'CONFIRMADO'
      : assignment.statusAjudante === 'CONFIRMADO'
  ) : false;

  const isDeclined = assignment ? (
    (viewerRole === 'TITULAR' || viewerRole === 'PRESIDENTE' || viewerRole === 'ORAÇÃO')
      ? assignment.status === 'RECUSADO'
      : assignment.statusAjudante === 'RECUSADO'
  ) : false;

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






  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Success/Status Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-6">
        <div className={`p-8 text-center ${isConfirmed ? 'bg-green-50/50' : isDeclined ? 'bg-red-50/50' : 'bg-white'}`}>
          <div className="mb-6 flex justify-center">
            {isConfirmed ? (
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
              </div>
            ) : isDeclined ? (
                <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                  <X className="h-10 w-10 text-red-600" strokeWidth={3} />
              </div>
            ) : (
                  <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-blue-500" />
                  </div>
            )}
          </div>

          {(myName || assignment?.titular?.nome) && (
            <p className="text-gray-500 font-medium mb-2">Olá, {myName || assignment?.titular?.nome}</p>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            {isConfirmed ? 'Confirmado!' : isDeclined ? 'Ausência Informada' : 'Confirmar Designação'}
          </h1>
          <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
            {isConfirmed ? 'Obrigado por confirmar sua parte.' : isDeclined ? 'Obrigado por nos avisar.' : 'Por favor, confirme se poderá realizar esta parte.'}
          </p>
        </div>

        {/* Info Cards */}
        <div className="p-6 pt-0 space-y-4">
          {/* Data Card */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">DATA</p>
              <p className="text-gray-900 font-bold capitalize">
                {assignment?.semana ? new Date(assignment.semana.dataInicio).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) : '-'}
              </p>
              <p className="text-xs text-gray-400">
                {assignment?.semana.descricao}
              </p>
            </div>
          </div>

          {/* Parte Card */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">PARTE</p>
              <p className="text-gray-900 font-bold">
                {assignment?.parteTemplate.titulo}
              </p>
              {assignment?.tituloDoTema && assignment.tituloDoTema !== assignment.parteTemplate.titulo && (
                <p className="text-xs text-gray-500 italic mt-0.5">"{assignment.tituloDoTema}"</p>
              )}
            </div>
          </div>

          {/* Specialized Participants Card for Student Parts */}
          {assignment?.ajudante && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-3">PARTICIPANTES</div>

              {/* Titular Row */}
              <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${viewerRole === 'TITULAR' ? 'bg-blue-100/50 -mx-2' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${viewerRole === 'TITULAR' ? 'text-blue-700' : 'text-gray-900'}`}>Titular</span>
                  {viewerRole === 'TITULAR' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold tracking-wide">VOCÊ</span>
                  )}
                </div>
                <span className={`text-sm ${viewerRole === 'TITULAR' ? 'text-blue-900 font-bold' : 'text-gray-600'}`}>{assignment.titular?.nome}</span>
              </div>

              <div className="h-px bg-gray-200 my-2" />

              {/* Assistant/Read Row */}
              <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${(viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') ? 'bg-blue-100/50 -mx-2' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${(viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') ? 'text-blue-700' : 'text-gray-900'}`}>
                    {assignment.parteTemplate.requerLeitor ? 'Leitor' : 'Ajudante'}
                        </span>
                        {(viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold tracking-wide">VOCÊ</span>
                  )}
                </div>
                <span className={`text-sm ${(viewerRole === 'AJUDANTE' || viewerRole === 'LEITOR') ? 'text-blue-900 font-bold' : 'text-gray-600'}`}>{assignment.ajudante.nome}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4">
            {!isConfirmed && !isDeclined ? (
              <div className="space-y-3">
                <Button
                  onClick={() => updateStatus('CONFIRMADO')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-lg font-bold shadow-sm transition-all active:scale-[0.98]"
                >
                  Confirmar
                </Button>
                <button
                  onClick={() => updateStatus('RECUSADO')}
                  className="w-full py-3 text-red-600 font-medium text-sm hover:bg-red-50 rounded-xl transition-colors"
                >
                  Não poderei realizar
                </button>
              </div>
            ) : (
              <button
                onClick={() => updateStatus('PENDENTE')}
                  className="w-full py-3 text-gray-400 font-medium text-sm flex items-center justify-center gap-2 hover:text-gray-600 transition-colors"
                >
                  <RotateCcw size={14} />
                  Desfazer confirmação
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-300 font-medium tracking-wide">JW Planner © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};
