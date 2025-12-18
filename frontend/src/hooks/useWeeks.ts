import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { MOCK_WEEKS } from '../lib/mockData';

import { USE_MOCK } from '../config';

export const useWeeks = () => {
  return useQuery({
    queryKey: ['weeks'],
    queryFn: async () => {
      if (USE_MOCK) return MOCK_WEEKS;
      const { data } = await api.get('/planning/weeks');
      return data;
    },
  });
};

export const useGenerateWeeks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (USE_MOCK) {
        console.log('Mock generate weeks:', month, year);
        return MOCK_WEEKS; // Return static weeks for now
      }
      const { data } = await api.post('/planning/weeks/generate', { month, year });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });
};
