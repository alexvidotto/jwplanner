import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useParts = () => {
  return useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const { data } = await api.get('/parts');
      return data;
    },
  });
};

export const useCreatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (part: any) => {
      const { data } = await api.post('/parts', part);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['week'] });
    },
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => {
      const { data: res } = await api.put(`/parts/${id}`, data);
      return res;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['week'] });
    },
  });
};

export const useDeletePart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/parts/${id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['week'] });
    },
  });
};

export const usePartHistory = (partId: string | null) => {
  return useQuery({
    queryKey: ['partHistory', partId],
    queryFn: async () => {
      if (!partId) return [];
      const { data } = await api.get(`/parts/${partId}/history`);
      return data;
    },
    enabled: !!partId,
  });
};
