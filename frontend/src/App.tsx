import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/features/Dashboard';
import { AdminParticipantsView } from './components/features/AdminParticipantsView';
import { AdminPartsView } from './components/features/AdminPartsView';
import { AdminSkillsView } from './components/features/AdminSkillsView';
import { AdminPlanner } from './components/features/AdminPlanner';
import { ParticipantView } from './components/features/ParticipantView';
import { useParticipants } from './hooks/useParticipants';
import { useParts } from './hooks/useParts';
import { useWeekByDate, useCreateWeek, useUpdateWeek } from './hooks/useWeeks';
import { transformWeekToFrontend, generateVirtualWeek, transformParticipantsToFrontend, transformPartsToFrontend } from './lib/transformers';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { parseTime } from './lib/utils';
import { MonthView } from './components/features/MonthView';
import { TrackingView } from './components/features/TrackingView';

const queryClient = new QueryClient();

const getNextMonday = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day == 0 ? -6 : 1);
  const newDate = new Date(date.setDate(diff));
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const AppContent = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // API Hooks
  const { data: participantsData, isLoading: isLoadingParticipants } = useParticipants();
  const { data: partsData, isLoading: isLoadingParts } = useParts();

  // Date State (Derived from URL or Default)
  const currentDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Parse YYYY-MM-DD as local date to avoid UTC shifts
      const [y, m, d] = dateParam.split('-').map(Number);
      if (y && m && d) {
        const date = new Date(y, m - 1, d);
        return getNextMonday(date);
      }
    }
    return getNextMonday(new Date());
  }, [searchParams]);

  const { data: weekData, isLoading: isLoadingWeek, refetch: refetchWeek } = useWeekByDate(currentDate);
  const { mutateAsync: createWeek } = useCreateWeek();
  const { mutateAsync: updateWeek } = useUpdateWeek();

  // Local state
  const [participants, setParticipants] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);

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
      const transformed = transformWeekToFrontend(weekData);

      // Safety check: if backend date differs significantly, we might have mismatch? 
      // But typically it matches.
      setActiveWeek(transformed);
    } else if (parts.length > 0) {
      // Generate Virtual
      setActiveWeek(generateVirtualWeek(currentDate, parts));
    }
  }, [weekData, isLoadingWeek, currentDate, parts, isLoadingParts]);

  const handleNavigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));

    // Update URL
    // We format as YYYY-MM-DD
    const dateStr = newDate.toISOString().split('T')[0];
    setSearchParams({ date: dateStr });

    // Trigger loading state visually immediately?
    setActiveWeek(null);
  };

  const handleJumpToCurrentWeek = () => {
    // Check if we are already on current week (no date param or date matches next monday)
    const currentParam = searchParams.get('date');
    if (!currentParam) {
      // Already on current week (default), do nothing to avoid reload/flicker or just ensuring activeWeek is set?
      // If we are "stuck" for some reason, we might want to reload, but usually we just want to navigate.
      // If activeWeek is null, the effect should handle it ONLY if we change something.
      // But if we do nothing, activeWeek remains whatever it is (likely correct).
      // We can just return.
      return;
    }

    // If not on current week, we clear params.
    setSearchParams({}); // Clear date param to default to Today
    setActiveWeek(null);
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
            const match = newWeek.designacoes.find((d: any) => d.parteTemplateId === p.templateId);
            if (match) {
              updates.push({
                id: match.id,
                assignedTo: p.assignedTo,
                assistantId: p.readerId || p.assistantId, // Use readerId if present, otherwise assistantId (simplification, assuming no overlap)
                status: p.status || 'PENDENTE',
                observation: p.observation,
                tituloDoTema: p.title,
                tempo: parseTime(p.time)
              });
            }
        }));

        if (updates.length > 0 || weekToSave.presidentId || weekToSave.isCanceled !== undefined) {
          await updateWeek({
            id: savedWeekId,
            data: {
              designacoes: updates,
              presidentId: weekToSave.presidentId,
              tipo: weekToSave.isCanceled ? 'NO_MEET' : 'NORMAL'
            }
          });
        }
      } else {
        // 2. Standard Update
        const updates: any[] = [];
        let orderCounter = 1;

        // Handle Opening Prayer
        if (weekToSave.openingPrayerPartId) {
          updates.push({
            id: weekToSave.openingPrayerPartId,
            parteTemplateId: weekToSave.openingPrayerTemplateId,
            assignedTo: weekToSave.openingPrayerId,
            assistantId: null,
            status: weekToSave.openingPrayerStatus,
            ordem: 0
          });
        }

        weekToSave.sections.forEach((s: any) => s.parts.forEach((p: any) => {
          updates.push({
            id: p.id,
            parteTemplateId: p.templateId,
            assignedTo: p.assignedTo,
            assistantId: p.readerId || p.assistantId,
            status: p.status,
            observation: p.observation,
            tituloDoTema: p.title,
            tempo: parseTime(p.time),
            ordem: orderCounter++
          });
        }));
        await updateWeek({
          id: savedWeekId,
          data: {
            designacoes: updates,
            presidentId: weekToSave.presidentId,
            tipo: weekToSave.isCanceled ? 'NO_MEET' : 'NORMAL'
          }
        });
      }

      await refetchWeek(); // Sync everything
    } catch (err) {
      console.error("Failed to save week", err);
      alert("Erro ao salvar semana.");
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    if (!activeWeek) return;

    const weekCopy = JSON.parse(JSON.stringify(activeWeek));
    let changeMade = false;

    // President
    if (assignmentId === 'president') {
      weekCopy.presidentStatus = newStatus;
      changeMade = true;
    }
    // Opening Prayer
    else if (assignmentId === 'openingPrayer') {
      weekCopy.openingPrayerStatus = newStatus;
      changeMade = true;
    }
    else {
      // Check sections
      // Logic to find part by customized Ids
      for (const section of weekCopy.sections) {
        for (const part of section.parts) {
          if (assignmentId === part.id) {
            part.status = newStatus;
            changeMade = true;
          } else if (assignmentId === `${part.id}-ass`) {
            part.assistantStatus = newStatus;
            changeMade = true;
          } else if (assignmentId === `${part.id}-read`) {
            part.readerStatus = newStatus;
            changeMade = true;
          }
        }
      }
    }

    if (changeMade) {
      await handleSaveWeek(weekCopy);
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
            onJumpToCurrentWeek={handleJumpToCurrentWeek}
            participants={participants}
            partTemplates={parts}
            onSave={handleSaveWeek}
          />
        ) : <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando semana...</div>
      } />
      <Route path="/month" element={<MonthView onBack={() => navigate('/')} />} />
      <Route path="/tracking" element={
        activeWeek ? (
          <TrackingView
            weekData={activeWeek}
            participants={participants}
            onBack={() => navigate('/')}
            onNavigateWeek={handleNavigateWeek}
            onJumpToCurrentWeek={handleJumpToCurrentWeek}
            onStatusChange={handleStatusChange}
          />
        ) : <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando semana...</div>
      } />
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
