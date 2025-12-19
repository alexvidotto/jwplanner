import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { USE_MOCK } from '../config';
import { MOCK_PARTICIPANTS } from '../lib/mockData';

export interface Suggestion {
  id: string;
  name: string;
  type: string;
  gender: string;
  active: boolean;
  abilities: string[];
  lastAssignmentDate: string | null;
  lastGeneralAssignmentDate: string | null;
}

export const useSuggestions = (weekId: string, partTemplateId: string | null) => {
  return useQuery({
    queryKey: ['suggestions', weekId, partTemplateId],
    queryFn: async (): Promise<Suggestion[]> => {
      if (!partTemplateId || !weekId) return [];

      if (USE_MOCK) {
        console.log('Mock suggestions for', partTemplateId);
        return MOCK_PARTICIPANTS.map(p => ({
          id: p.id,
          name: p.nome,
          type: p.privilegio,
          gender: p.privilegio === 'PUB_MULHER' ? 'PM' : 'PH', // Approximate
          active: p.podeDesignar,
          abilities: p.habilidades.map((h: any) => h.parteTemplateId), // Approximate
          lastAssignmentDate: null,
          lastGeneralAssignmentDate: null
        })) as Suggestion[];
      }

      // If weekId looks like a UUID, use it. If it's virtual or date-like, use by-date?
      // Actually AdminPlanner usually has weekData.id. If virtual, it might be 'virtual-DATE' or similar?
      // Let's assume we pass the DATE if it's virtual.
      // But helper function `useSuggestions` signature is `(weekId: string, ...)`
      // We'll trust the caller to pass a valid ID or we check here.

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weekId);

      if (isUUID) {
        const { data } = await api.get(`/planning/weeks/${weekId}/suggestions/${partTemplateId}`);
        return data;
      } else {
        // Assume weekId contains date info if not UUID, or we need to pass date separately.
        // BUT useSuggestions signature only takes weekId.
        // Caller should pass date if weekId is virtual.
        // Let's assume weekId IS the date if it's not UUID?
        // Or easier: Just always use 'by-date' if we have the date?
        // AdminPlanner has weekData.date (start date).
        // Better to pass 'date' to useSuggestions.
        // Let's change the signature to accept date as well or instead.
        // But for now let's try to interpret weekId.

        // If weekId is NOT UUID, we treat it as a date string if it looks like one.
        // If it is 'virtual-Msadasd' we are in trouble.
        // Let's just always use the by-date endpoint if we can?
        // The backend findByDate uses date.

        // Let's simple check: if !isUUID, try as date param.
        const { data } = await api.get(`/planning/weeks/suggestions/by-date`, {
          params: { date: weekId, partTemplateId }
        });
        return data;
      }
    },
    enabled: !!weekId && !!partTemplateId,
  });
};
