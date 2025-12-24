import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
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
import { ReportsView } from './components/features/ReportsView';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminUsersPage } from './pages/AdminUsersPage';

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
      setActiveWeek(transformed);
    } else if (parts.length > 0) {
      // Generate Virtual
      setActiveWeek(generateVirtualWeek(currentDate, parts));
    }
  }, [weekData, isLoadingWeek, currentDate, parts, isLoadingParts]);

  const handleNavigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    const dateStr = newDate.toISOString().split('T')[0];
    setSearchParams({ date: dateStr });
    setActiveWeek(null);
  };

  const handleJumpToCurrentWeek = () => {
    const currentParam = searchParams.get('date');
    if (!currentParam) {
      return;
    }
    setSearchParams({}); // Clear date param to default to Today
    setActiveWeek(null);
  };

  const handleDateSelect = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    setSearchParams({ date: dateStr });
    setActiveWeek(null); // Force reload
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
        const usedMatchIds = new Set<string>();

        // Handle Opening Prayer
        const openingPrayerTemplateId = weekToSave.openingPrayerTemplateId;
        const openingPrayerId = weekToSave.openingPrayerId;

        // Try to find the Opening Prayer part in the new week
        let prayerMatch = newWeek.designacoes.find((d: any) =>
          d.parteTemplateId === openingPrayerTemplateId ||
          d.parteTemplate.titulo === 'Oração Inicial' // Fallback
        );

        if (prayerMatch) {
          if (openingPrayerId) {
            updates.push({
              id: prayerMatch.id,
              assignedTo: openingPrayerId,
              assistantId: null,
              status: weekToSave.openingPrayerStatus || 'PENDENTE'
            });
          }
          usedMatchIds.add(prayerMatch.id);
        }

        let orderCounter = 1;

        weekToSave.sections.forEach((s: any) => s.parts.forEach((p: any) => {
          // Find a match that hasn't been used yet
          const match = newWeek.designacoes.find((d: any) => d.parteTemplateId === p.templateId && !usedMatchIds.has(d.id));

          if (match) {
            // Update existing auto-created part
            updates.push({
              id: match.id,
              assignedTo: p.assignedTo,
              assistantId: p.readerId || p.assistantId,
              status: p.status || 'PENDENTE',
              assistantStatus: p.assistantStatus || p.readerStatus || 'PENDENTE',
              observation: p.observation,
              tituloDoTema: p.title,
              tempo: parseTime(p.time),
              ordem: orderCounter++
            });
            usedMatchIds.add(match.id);
          } else {
            // Treat as NEW added part
            updates.push({
              id: p.id, // Use the virtual/new ID
              parteTemplateId: p.templateId, // Ensure template ID is passed for creating
              assignedTo: p.assignedTo,
              assistantId: p.readerId || p.assistantId,
              status: p.status || 'PENDENTE',
              assistantStatus: p.assistantStatus || p.readerStatus || 'PENDENTE',
              observation: p.observation,
              tituloDoTema: p.title,
              tempo: parseTime(p.time),
              ordem: orderCounter++
            });
          }
        }));

        if (updates.length > 0 || weekToSave.presidentId || weekToSave.isCanceled !== undefined) {
          await updateWeek({
            id: savedWeekId,
            data: {
              designacoes: updates,
              presidentId: weekToSave.presidentId,
              presidentStatus: weekToSave.presidentStatus,
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
        } else if (weekToSave.openingPrayerId) {
          updates.push({
            id: `new-op-${Date.now()}`,
            parteTemplateId: weekToSave.openingPrayerTemplateId || 'tpl_oracao_inicial',
            assignedTo: weekToSave.openingPrayerId,
            assistantId: null,
            status: weekToSave.openingPrayerStatus || 'PENDENTE',
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
            assistantStatus: p.assistantStatus || p.readerStatus,
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
            presidentStatus: weekToSave.presidentStatus,
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

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/confirm/:assignmentId" element={<ConfirmationPage />} />
      <Route path="/confirm/:assignmentId/:personId" element={<ConfirmationPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE', 'ASSISTENTE', 'USER']} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/planner" replace />} />


          {/* Planner - Accessible by everyone, but read-only for USER/ASSISTENTE/PRESIDENTE? (Wait, Presidente can edit? Plan says "Admins: Can drag, drop, edit, save. Others: Can ONLY view") 
              Plan: "Pass readOnly prop to AdminPlanner based on role (True if not ADMIN)."
              So only ADMIN can edit.
          */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE', 'ASSISTENTE', 'USER']} />}>
            <Route path="/planner" element={
              activeWeek ? (
                <AdminPlanner
                  weekData={activeWeek}
                  setWeekData={handleUpdateWeek}
                  onBack={() => navigate('/')}
                  onNavigateWeek={handleNavigateWeek}
                  onJumpToCurrentWeek={handleJumpToCurrentWeek}
                  onSelectDate={handleDateSelect}
                  participants={participants}
                  partTemplates={parts}
                  onSave={handleSaveWeek}
                  readOnly={useAuth().userProfile?.role !== 'ADMIN'}
                />
              ) : <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando semana...</div>
            } />
          </Route>

          {/* Admin only - Other pages */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/participants" element={<AdminParticipantsView participants={participants} setParticipants={setParticipants} onBack={() => navigate('/')} />} />
            <Route path="/parts" element={<AdminPartsView parts={parts} setParts={setParts} onBack={() => navigate('/')} />} />
            <Route path="/skills" element={<AdminSkillsView participants={participants} setParticipants={setParticipants} parts={parts} onBack={() => navigate('/')} />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Tracking: Admin, Presidente, Assistente */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE', 'ASSISTENTE']} />}>
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
          </Route>

          {/* Reports: Admin, Presidente */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE']} />}>
            <Route path="/reports" element={<ReportsView />} />
          </Route>

          <Route path="/month" element={<MonthView onBack={() => navigate('/')} />} />

          {/* Deprecated/Mock page - leaving for now or removing? Keeping as is. */}
          <Route path="/my-assignments" element={
            <ParticipantView
              weekData={activeWeek}
              setWeekData={handleUpdateWeek}
              currentUser={participants[0]} // Mock current user for now
              onBack={() => navigate('/')}
              participants={participants}
            />
          } />
        </Route>
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingSpinner />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
