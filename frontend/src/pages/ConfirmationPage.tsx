
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Check, X, Clock, User, ChevronLeft, AlertCircle, MoreVertical, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Assignment {
  id: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO';
  parteTemplate: {
    titulo: string;
    secao: string;
  };
  semana: {
    dataInicio: string;
    descricao: string;
  };
  titular?: { nome: string };
  ajudante?: { nome: string };
  observacao?: string;
  tempo?: number;
  tituloDoTema?: string;
}

export const ConfirmationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [token]);

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`http://localhost:3000/planning/assignments/token/${token}`);
      if (!response.ok) {
        throw new Error('Designação não encontrada ou link inválido.');
      }
      const data = await response.json();
      setAssignment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE') => {
    if (!token) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/planning/assignments/token/${token}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await fetchAssignment();
    } catch (err: any) {
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setActionLoading(false);
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
  const isConfirmed = assignment.status === 'CONFIRMADO';
  const isDeclined = assignment.status === 'RECUSADO';

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
                  Informar Ausência
                </button>
              </div>
            )}
          </div>
        )}
        {/* Header */}
        <div className={`p-6 text-center ${isConfirmed ? 'bg-green-50' : isDeclined ? 'bg-red-50' : 'bg-blue-50'}`}>
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
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </div>

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
              {assignment.tituloDoTema && (
                <p className="text-xs text-gray-600 mt-1 italic">"{assignment.tituloDoTema}"</p>
              )}
            </div>
          </div>

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
              {actionLoading ? 'Confirmando...' : 'Confirmar Presença'}
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
