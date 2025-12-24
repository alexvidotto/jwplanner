import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
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
import { api } from './lib/api';
import { MonthView } from './components/features/MonthView';
import { TrackingView } from './components/features/TrackingView';
import { ReportsView } from './components/features/ReportsView';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';

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
  const queryClient = useQueryClient();

  // API Hooks
  const { data: participantsData, isLoading: isLoadingParticipants } = useParticipants();
  const { data: partsData, isLoading: isLoadingParts } = useParts();
  const { userProfile } = useAuth();

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

        // Critical: Update activeWeek ID immediately to prevent race conditions (duplicate creates)
        setActiveWeek((prev: any) => prev ? { ...prev, id: newWeek.id } : prev);

        const updates: any[] = [];
        const usedMatchIds = new Set<string>();
        const idMap = new Map<string, string>(); // Virtual -> Real

        // Handle Opening Prayer
        const openingPrayerTemplateId = weekToSave.openingPrayerTemplateId;
        const openingPrayerId = weekToSave.openingPrayerId;

        // Try to find the Opening Prayer part in the new week
        let prayerMatch = newWeek.designacoes.find((d: any) =>
          d.parteTemplateId === openingPrayerTemplateId ||
          d.parteTemplate.titulo === 'Oração Inicial' // Fallback
        );

        if (prayerMatch) {
          if (weekToSave.openingPrayerPartId && (weekToSave.openingPrayerPartId.startsWith('virtual-') || weekToSave.openingPrayerPartId.startsWith('new-'))) {
            idMap.set(weekToSave.openingPrayerPartId, prayerMatch.id);
          }
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
            if (p.id.startsWith('virtual-') || p.id.startsWith('new-')) {
              idMap.set(p.id, match.id);
            }
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

          // Apply ID Map to activeWeek immediately
          setActiveWeek((prev: any) => {
            if (!prev) return prev;
            const updated = { ...prev };

            // Update Opening Prayer Part ID
            if (updated.openingPrayerPartId && idMap.has(updated.openingPrayerPartId)) {
              updated.openingPrayerPartId = idMap.get(updated.openingPrayerPartId);
            }

            // Update Parts
            updated.sections = updated.sections.map((s: any) => ({
              ...s,
              parts: s.parts.map((p: any) => {
                if (idMap.has(p.id)) {
                  return { ...p, id: idMap.get(p.id) };
                }
                return p;
              })
            }));

            return updated;
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

    // Optimistic Update
    const previousWeek = JSON.parse(JSON.stringify(activeWeek));
    let personIdUpdate: string | null = null;
    let assignmentRealIdForCache: string | null = null;

    const newWeekData = { ...activeWeek };

    // Helper to update parts
    const updatePartStatus = (part: any) => {
      if (assignmentId === part.id) {
        part.status = newStatus;
        personIdUpdate = part.assignedTo;
        assignmentRealIdForCache = part.id;
      } else if (assignmentId === `${part.id}-ass`) {
        part.assistantStatus = newStatus;
        personIdUpdate = part.assistantId;
        assignmentRealIdForCache = part.id;
      } else if (assignmentId === `${part.id}-read`) {
        part.readerStatus = newStatus;
        personIdUpdate = part.readerId;
        assignmentRealIdForCache = part.id;
      }
    };

    if (assignmentId === 'president' || assignmentId.endsWith('-president')) {
      newWeekData.presidentStatus = newStatus;
      personIdUpdate = newWeekData.presidentId;
    } else if (assignmentId === 'openingPrayer' || assignmentId.endsWith('-prayer') || assignmentId === activeWeek.openingPrayerPartId) {
      newWeekData.openingPrayerStatus = newStatus;
      personIdUpdate = newWeekData.openingPrayerId;
    } else {
      newWeekData.sections = newWeekData.sections.map((section: any) => ({
        ...section,
        parts: section.parts.map((p: any) => {
          const newP = { ...p };
          updatePartStatus(newP);
          return newP;
        })
      }));
    }

    // Apply Optimistic Update to Local State
    setActiveWeek(newWeekData);

    // Also Update React Query Cache to prevent revert on background refetch
    const queryKey = ['week', currentDate.toISOString()];
    const previousCache = queryClient.getQueryData(queryKey);

    if (previousCache) {
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const newCache = JSON.parse(JSON.stringify(old)); // Deep clone to be safe

        // Update Week-level fields (President/Prayer)
        if (assignmentId === 'president' || assignmentId.endsWith('-president')) {
          newCache.statusPresidente = newStatus;
        } else if (assignmentId === 'openingPrayer' || assignmentId.endsWith('-prayer') || assignmentId === activeWeek.openingPrayerPartId) {
          newCache.statusOracao = newStatus;
          // Also update Designacao if exists in cache
          if (newCache.designacoes) {
            const prayerPart = newCache.designacoes.find((d: any) => d.tituloDoTema === 'Oração Inicial' || (d.parteTemplate && d.parteTemplate.titulo === 'Oração Inicial'));
            if (prayerPart) prayerPart.status = newStatus;
          }
        }

        // Update Designations (Parts)
        if (assignmentRealIdForCache && newCache.designacoes) {
          newCache.designacoes = newCache.designacoes.map((d: any) => {
            if (d.id === assignmentRealIdForCache) {
              if (assignmentId === d.id) d.status = newStatus;
              else if (assignmentId === `${d.id}-ass`) d.statusAjudante = newStatus;
              else if (assignmentId === `${d.id}-read`) d.statusAjudante = newStatus; // Correct field for Reader per transformers.ts
            }
            return d;
          });
        }
        return newCache;
      });
    }

    try {
      // Determine real ID for API call
      let realId = assignmentId;
      let targetPersonId = personIdUpdate;

      // Map special IDs or Suffixes
      if (assignmentId === 'president' || assignmentId.endsWith('-president')) {
        // Use granular updateWeek for President Status without full save/refetch
        // Using api.put directly to avoid query invalidation from useUpdateWeek
        await api.put(`/planning/weeks/${activeWeek.id}`, {
          presidentStatus: newStatus
        });
        return;
      }

      if (assignmentId === 'openingPrayer' || assignmentId.endsWith('-prayer') || (activeWeek.openingPrayerPartId && assignmentId === activeWeek.openingPrayerPartId)) {
        // Use granular updateWeek for Prayer Status
        // Using api.put directly to avoid query invalidation from useUpdateWeek
        await api.put(`/planning/weeks/${activeWeek.id}`, {
          openingPrayerStatus: newStatus
        });
        return;
      }

      // Stripping suffixes for API call
      if (assignmentId.endsWith('-ass')) {
        realId = assignmentId.replace('-ass', '');
      } else if (assignmentId.endsWith('-read')) {
        realId = assignmentId.replace('-read', '');
      }

      // Check if realId is a valid UUID (not new-...)
      if (realId.startsWith('new-') || realId.startsWith('virtual-')) {
        await handleSaveWeek(newWeekData);
        return;
      }

      // Call Granular Endpoint (Optimized)
      await api.patch(`/planning/assignments/${realId}/status`, {
        status: newStatus,
        personId: targetPersonId
      });

    } catch (error) {
      console.error("Failed to update status", error);
      // Revert Optimistic Update
      setActiveWeek(previousWeek);
      if (previousCache) {
        queryClient.setQueryData(queryKey, previousCache);
      }
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  if (isLoadingParticipants || isLoadingParts) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando dados iniciais...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
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
                  readOnly={userProfile?.role !== 'ADMIN'}
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
