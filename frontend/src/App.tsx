import { useState, useEffect } from 'react';
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
import { useWeeks } from './hooks/useWeeks';
import { transformWeeksToFrontend, transformParticipantsToFrontend, transformPartsToFrontend } from './lib/transformers';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  // API Hooks
  const { data: participantsData, isLoading: isLoadingParticipants } = useParticipants();
  const { data: partsData, isLoading: isLoadingParts } = useParts();
  const { data: weeksData, isLoading: isLoadingWeeks } = useWeeks();

  // Local state for UI interactivity (optimistic UI or local manipulation before save)
  const [participants, setParticipants] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Sync API data to local state when loaded
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

  useEffect(() => {
    if (weeksData) {
      setWeeks(transformWeeksToFrontend(weeksData));
    }
  }, [weeksData]);

  const currentWeek = weeks[currentWeekIndex];

  const handleNavigateWeek = (direction: number) => {
    const newIndex = currentWeekIndex + direction;
    if (newIndex >= 0 && newIndex < weeks.length) {
      setCurrentWeekIndex(newIndex);
    }
  };

  const handleUpdateWeek = (updatedWeek: any) => {
    // In a real app, this should probably trigger a mutation to save immediately or debounced.
    // For now, we update local state.
    const newWeeks = [...weeks];
    newWeeks[currentWeekIndex] = updatedWeek;
    setWeeks(newWeeks);
  };

  if (isLoadingParticipants || isLoadingParts || isLoadingWeeks) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard onNavigate={navigate} />} />
      <Route path="/participants" element={<AdminParticipantsView participants={participants} setParticipants={setParticipants} onBack={() => navigate('/')} />} />
      <Route path="/parts" element={<AdminPartsView parts={parts} setParts={setParts} onBack={() => navigate('/')} />} />
      <Route path="/skills" element={<AdminSkillsView participants={participants} setParticipants={setParticipants} parts={parts} onBack={() => navigate('/')} />} />
      <Route path="/planner" element={
        currentWeek ? (
          <AdminPlanner
            weekData={currentWeek}
            setWeekData={handleUpdateWeek}
            onBack={() => navigate('/')}
            onNavigateWeek={handleNavigateWeek}
            participants={participants}
            partTemplates={parts}
          />
        ) : <div className="p-10 text-center">Nenhuma semana encontrada.</div>
      } />
      <Route path="/month" element={<AdminMonthView weeks={weeks} onBack={() => navigate('/')} participants={participants} />} />
      <Route path="/my-assignments" element={
        <ParticipantView
          weekData={currentWeek}
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
