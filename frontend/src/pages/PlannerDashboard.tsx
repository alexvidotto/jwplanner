import { useState } from 'react';
import { useParticipants, useCreateParticipant } from '../services/participants';

import { useWeeks, useGenerateWeeks } from '../services/weeks';

export default function PlannerDashboard() {
  const { data: participants, isLoading: isLoadingPart } = useParticipants();
  const { data: weeks, isLoading: isLoadingWeeks } = useWeeks();
  const generateWeeks = useGenerateWeeks();

  const createParticipant = useCreateParticipant();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddParticipant = async () => {
    await createParticipant.mutateAsync({
      nome: newName,
      email: `${newName.toLowerCase().replace(/\s/g, '.')}@example.com`,
      podeDesignar: true
    });
    setNewName('');
    setShowAddForm(false);
  };

  const handleGenerate = async () => {
    const now = new Date();
    await generateWeeks.mutateAsync({ month: now.getMonth(), year: now.getFullYear() });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Planner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingWeeks ? <p>Loading weeks...</p> : weeks?.map(week => (
          <div key={week.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{week.descricao}</h2>
            <p className="text-gray-600">Start: {new Date(week.dataInicio).toLocaleDateString()}</p>
            <button
              onClick={() => alert(`Edit week ${week.id}`)}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Edit Week
            </button>
          </div>
        ))}
        {weeks?.length === 0 && (
          <div className="border p-4 rounded shadow flex flex-col items-center justify-center min-h-[150px]">
            <p className="mb-2">No weeks found</p>
            <button
              onClick={handleGenerate}
              className="bg-purple-600 text-white px-4 py-2 rounded"
              disabled={generateWeeks.isPending}
            >
              {generateWeeks.isPending ? 'Generating...' : 'Generate Current Month'}
            </button>
          </div>
        )}
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Participants</h2>

        <div className="mb-4">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Add Participant
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                className="border p-2 rounded"
                placeholder="Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <button
                onClick={handleAddParticipant}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Participant Table */}
        {isLoadingPart ? <p>Loading...</p> : (
          <div className="border rounded">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {participants?.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.nome}</td>
                    <td className="p-2">{p.email}</td>
                    <td className="p-2">{p.privilegio || '-'}</td>
                  </tr>
                ))}
                {participants?.length === 0 && (
                  <tr><td colSpan={3} className="p-4 text-center">No participants found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
