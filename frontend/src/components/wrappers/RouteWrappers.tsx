import { useOutletContext, useNavigate } from 'react-router-dom';
import { AdminPlanner } from '../features/AdminPlanner';
import { AdminParticipantsView } from '../features/AdminParticipantsView';
import { AdminPartsView } from '../features/AdminPartsView';
import { AdminSkillsView } from '../features/AdminSkillsView';
import { TrackingView } from '../features/TrackingView';
import { MonthView } from '../features/MonthView';
import { MyAssignmentsView } from '../features/MyAssignmentsView';

export const PlannerWrapper = () => {

  const context: any = useOutletContext();

  if (!context.activeWeek) return <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando semana...</div>;

  return (
    <AdminPlanner
      weekData={context.activeWeek}
      setWeekData={context.handleUpdateWeek}
      onNavigateWeek={context.handleNavigateWeek}
      onJumpToCurrentWeek={context.handleJumpToCurrentWeek}
      onSelectDate={context.handleDateSelect}
      participants={context.participants}
      partTemplates={context.parts}
      onSave={context.handleSaveWeek}
      readOnly={context.userProfile?.role !== 'ADMIN'}
      isDirty={context.isDirty}
      setIsDirty={context.setIsDirty}
    />
  );
};

export const ParticipantsWrapper = () => {
  const navigate = useNavigate();
  const context: any = useOutletContext();
  return <AdminParticipantsView participants={context.participants} setParticipants={context.setParticipants} onBack={() => navigate('/')} />;
};

export const PartsWrapper = () => {
  const navigate = useNavigate();
  const context: any = useOutletContext();
  return <AdminPartsView parts={context.parts} setParts={context.setParts} onBack={() => navigate('/')} />;
};

export const SkillsWrapper = () => {
  const navigate = useNavigate();
  const context: any = useOutletContext();
  return (
    <AdminSkillsView
      participants={context.participants}
      setParticipants={context.setParticipants}
      parts={context.parts}
      onBack={() => navigate('/')}
      isDirty={context.isDirty}
      setIsDirty={context.setIsDirty}
    />
  );
};

export const TrackingWrapper = () => {
  const navigate = useNavigate();
  const context: any = useOutletContext();

  if (!context.activeWeek) return <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando semana...</div>;

  return (
    <TrackingView
      weekData={context.activeWeek}
      participants={context.participants}
      onBack={() => navigate('/')}
      onNavigateWeek={context.handleNavigateWeek}
      onJumpToCurrentWeek={context.handleJumpToCurrentWeek}
      onStatusChange={context.handleStatusChange}
    />
  );
};

export const MyAssignmentsWrapper = () => {
  return <MyAssignmentsView />;
};

export const MonthWrapper = () => {
  const navigate = useNavigate();
  return <MonthView onBack={() => navigate('/')} />;
};
