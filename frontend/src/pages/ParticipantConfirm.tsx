import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ParticipantConfirm() {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    // TODO: Fetch assignment by token
    // Mock for now
    setTimeout(() => {
      setAssignment({
        titulo: 'Leitura da Bíblia',
        data: '21 de Dezembro',
      });
      setStatus('success');
    }, 1000);
  }, [token]);

  const handleConfirm = () => {
    // Call API to confirm
    alert('Confirmed!');
  };

  const handleRefuse = () => {
    // Call API to refuse
    alert('Refused!');
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'error') return <div>Invalid Link</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Sua Designação</h1>
        <p className="text-lg text-gray-700 mb-6">{assignment.data}</p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold">{assignment.titulo}</h2>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleConfirm}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg"
          >
            Confirmar Presença
          </button>
          <button
            onClick={handleRefuse}
            className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 px-4 rounded-lg"
          >
            Não poderei ir
          </button>
        </div>
      </div>
    </div>
  );
}
