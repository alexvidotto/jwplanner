import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useParticipants = () => {
  return useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
};

export const useCreateParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (participant: any) => {
      const { data } = await api.post('/users', participant);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};

export const useUpdateParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => {
      const { data: res } = await api.put(`/users/${id}`, data);
      return res;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};

export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};

export const useBulkUpdateParticipants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; abilities: string[] }[]) => {
      const { data } = await api.post('/users/bulk-skills', { updates });
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};
export const useParticipantHistory = (userId: string | null) => {
  return useQuery({
    queryKey: ['participantHistory', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await api.get(`/users/${userId}/history`);
      return data;
    },
    enabled: !!userId,
  });
};
