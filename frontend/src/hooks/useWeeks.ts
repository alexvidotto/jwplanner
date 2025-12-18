import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { MOCK_WEEKS } from '../lib/mockData';

import { USE_MOCK } from '../config';

export const useWeekByDate = (date: Date) => {
  return useQuery({
    queryKey: ['week', date.toISOString()],
    queryFn: async () => {
      if (USE_MOCK) return MOCK_WEEKS.find(w => new Date(w.dataInicio).toDateString() === date.toDateString());
      try {
        const { data } = await api.get('/planning/weeks/by-date', { params: { date: date.toISOString() } });
        return data;
      } catch (error: any) {
        if (error.response && error.response.status === 404) return null;
        return null; // Return null if not found (or error) to trigger virtual generation
      }
    },
    retry: false, // Don't retry 404s
  });
};

export const useCreateWeek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date }: { date: Date }) => {
      const { data } = await api.post('/planning/weeks', { date: date.toISOString() });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['week', variables.date.toISOString()] });
    },
  });
};

export const useUpdateWeek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const resp = await api.put(`/planning/weeks/${id}`, data);
      return resp.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['week'] }); // Invalidate all week queries loosely or specific
      // We can invalidate specific date if we knew it? Or just 'week'.
    },
  });
};

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
