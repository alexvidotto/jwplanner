import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/features/Dashboard';
import { AdminParticipantsView } from './components/features/AdminParticipantsView';
import { AdminPartsView } from './components/features/AdminPartsView';
import { AdminSkillsView } from './components/features/AdminSkillsView';
import { AdminPlanner } from './components/features/AdminPlanner';
import { AdminMonthView } from './components/features/AdminMonthView';
import { ParticipantView } from './components/features/ParticipantView';
import { useParticipants } from './hooks/useParticipants';
import { useParts } from './hooks/useParts';
import { useWeekByDate, useCreateWeek, useUpdateWeek } from './hooks/useWeeks';
import { transformWeekToFrontend, generateVirtualWeek, transformParticipantsToFrontend, transformPartsToFrontend } from './lib/transformers';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  // API Hooks
  const { data: participantsData, isLoading: isLoadingParticipants } = useParticipants();
  const { data: partsData, isLoading: isLoadingParts } = useParts();

  // Date State (Monday of current week)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1);
    const date = new Date(d.setDate(diff));
    date.setHours(0, 0, 0, 0); // Normalize
    return date;
  });

  const { data: weekData, isLoading: isLoadingWeek, refetch: refetchWeek } = useWeekByDate(currentDate);
  const { mutateAsync: createWeek } = useCreateWeek();
  const { mutateAsync: updateWeek } = useUpdateWeek();

  // Local state
  const [participants, setParticipants] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  // We manage local modifications via AdminPlanner's internal state usually, 
  // but if we want to bubble up, we can.
  // AdminPlanner accepts setWeekData to update its local prop, which is fine.
  // BUT AdminPlanner is remounted if key changes?
  // Or currentWeek object reference changes.

  // Computed Current Week (Virtual or Real)
  // We use a state to hold the 'displayed' week to allow local edits to persist across renders 
  // until saved? No, AdminPlanner handles local edits.
  // We just need to pass the INITIAL data correctly.

  // Solution: We don't hoist 'currentWeek' state up to App unless we want to.
  // But AdminPlanner expects 'weekData' and 'setWeekData'.
  // We can just pass the computed week and a dummy setWeekData if we don't need top-level control,
  // OR we hoist state. Hoisting is unsafe if we switch weeks rapidly.
  // Let's rely on AdminPlanner's internal state handling derived from props?
  // AdminPlanner: "const [weekData, setWeekData] = ... props?" No, it uses props directly.
  // It uses `weekData` from props. It does NOT have local state for weekData.
  // So we MUST hoist the state here.

  const [activeWeek, setActiveWeek] = useState<any>(null);

  useEffect(() => {
    if (participantsData) {
      setParticipants(transformParticipantsToFrontend(participantsData));
    }
  }, [participantsData]);

  useEffect(() => {
    if (partsData) {
      setParts(transformPartsToFrontend(partsData));
    }
  }, [partsData]);

  // Sync activeWeek when API data changes or Date changes
  useEffect(() => {
    if (isLoadingWeek || isLoadingParts) return; // Wait loading

    if (weekData) {
      setActiveWeek(transformWeekToFrontend(weekData));
    } else if (parts.length > 0) {
      // Generate Virtual
      setActiveWeek(generateVirtualWeek(currentDate, parts));
    }
  }, [weekData, isLoadingWeek, currentDate, parts, isLoadingParts]);

  const handleNavigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
    setActiveWeek(null); // Clear active week while loading new one
  };

  const handleUpdateWeek = (updatedWeek: any) => {
    setActiveWeek(updatedWeek);
  };

  const handleSaveWeek = async (weekToSave: any) => {
    try {
      let savedWeekId = weekToSave.id;

      // 1. If Virtual, Create Week first
      if (!savedWeekId || savedWeekId.startsWith('virtual-')) {
        const newWeek = await createWeek({ date: currentDate });
        savedWeekId = newWeek.id;

        const updates: any[] = [];

        // Handle Opening Prayer
        if (weekToSave.openingPrayerId) {
          const match = newWeek.designacoes.find((d: any) => d.parteTemplateId === weekToSave.openingPrayerTemplateId);
          if (match) {
            updates.push({
              id: match.id,
              assignedTo: weekToSave.openingPrayerId,
              assistantId: null,
              status: weekToSave.openingPrayerStatus
            });
          }
        }

        weekToSave.sections.forEach((s: any) => s.parts.forEach((p: any) => {
          if (p.assignedTo || p.assistantId) {
            const match = newWeek.designacoes.find((d: any) => d.parteTemplateId === p.templateId);
            if (match) {
              updates.push({
                id: match.id,
                assignedTo: p.assignedTo,
                assistantId: p.assistantId,
                status: p.status || 'PENDENTE'
              });
            }
          }
        }));

        if (updates.length > 0 || weekToSave.presidentId) {
          await updateWeek({ id: savedWeekId, data: { designacoes: updates, presidentId: weekToSave.presidentId } });
        }
      } else {
        // 2. Standard Update
        const updates: any[] = [];

        // Handle Opening Prayer
        if (weekToSave.openingPrayerPartId) {
          updates.push({
            id: weekToSave.openingPrayerPartId,
            assignedTo: weekToSave.openingPrayerId,
            assistantId: null,
            status: weekToSave.openingPrayerStatus
          });
        }

        weekToSave.sections.forEach((s: any) => s.parts.forEach((p: any) => {
          updates.push({
            id: p.id,
            assignedTo: p.assignedTo,
            assistantId: p.assistantId,
            status: p.status
          });
        }));
        await updateWeek({ id: savedWeekId, data: { designacoes: updates, presidentId: weekToSave.presidentId } });
      }

      await refetchWeek(); // Sync everything
    } catch (err) {
      console.error("Failed to save week", err);
      alert("Erro ao salvar semana.");
    }
  };

  if (isLoadingParticipants || isLoadingParts) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando dados iniciais...</div>;
  }

  // Loading week indicator could be inside Planner or here.
  // If activeWeek is null, we show loading?

  return (
    <Routes>
      <Route path="/" element={<Dashboard onNavigate={navigate} />} />
      <Route path="/participants" element={<AdminParticipantsView participants={participants} setParticipants={setParticipants} onBack={() => navigate('/')} />} />
      <Route path="/parts" element={<AdminPartsView parts={parts} setParts={setParts} onBack={() => navigate('/')} />} />
      <Route path="/skills" element={<AdminSkillsView participants={participants} setParticipants={setParticipants} parts={parts} onBack={() => navigate('/')} />} />
      <Route path="/planner" element={
        activeWeek ? (
          <AdminPlanner
            weekData={activeWeek}
            setWeekData={handleUpdateWeek}
            onBack={() => navigate('/')}
            onNavigateWeek={handleNavigateWeek}
            participants={participants}
            partTemplates={parts}
            onSave={handleSaveWeek}
          />
        ) : <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando semana...</div>
      } />
      <Route path="/month" element={<AdminMonthView weeks={[]} onBack={() => navigate('/')} participants={participants} />} />
      <Route path="/my-assignments" element={
        <ParticipantView
          weekData={activeWeek}
          setWeekData={handleUpdateWeek}
          currentUser={participants[0]} // Mock current user for now
          onBack={() => navigate('/')}
          participants={participants}
        />
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingSpinner />
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}
