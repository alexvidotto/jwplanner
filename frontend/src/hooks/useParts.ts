import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { MOCK_PART_TEMPLATES } from '../lib/mockData';

import { USE_MOCK } from '../config';

export const useParts = () => {
  return useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      if (USE_MOCK) return MOCK_PART_TEMPLATES;
      const { data } = await api.get('/parts');
      return data;
    },
  });
};

export const useCreatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (part: any) => {
      if (USE_MOCK) {
        console.log('Mock create part:', part);
        return { id: 'mock-part-' + Date.now(), ...part };
      }
      const { data } = await api.post('/parts', part);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => {
      if (USE_MOCK) {
        console.log('Mock update part:', id, data);
        return { id, ...data };
      }
      const { data: res } = await api.put(`/parts/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
  });
};

export const useDeletePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        console.log('Mock delete part:', id);
        return;
      }
      await api.delete(`/parts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
  });
};
