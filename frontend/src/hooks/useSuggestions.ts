import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface Suggestion {
  id: string;
  name: string;
  type: string;
  gender: string;
  active: boolean;
  abilities: string[];
  lastAssignmentDate: string | null;
  lastGeneralAssignmentDate: string | null;
  history?: { date: string; role: string; title: string; isSpecific: boolean }[];
}

export const useSuggestions = (weekId: string, partTemplateId: string | null) => {
  return useQuery({
    queryKey: ['suggestions', weekId, partTemplateId],
    queryFn: async (): Promise<Suggestion[]> => {
      if (!partTemplateId || !weekId) return [];

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weekId);

      if (isUUID) {
        const { data } = await api.get(`/planning/weeks/${weekId}/suggestions/${partTemplateId}`);
        return data;
      } else {
        const { data } = await api.get(`/planning/weeks/suggestions/by-date`, {
          params: { date: weekId, partTemplateId }
        });
        return data;
      }
    },
    enabled: !!weekId && !!partTemplateId,
  });
};
