import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { MOCK_PARTICIPANTS } from '../lib/mockData';

import { USE_MOCK } from '../config';

export const useParticipants = () => {
  return useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      if (USE_MOCK) return MOCK_PARTICIPANTS;
      const { data } = await api.get('/users');
      return data;
    },
  });
};

export const useCreateParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (participant: any) => {
      if (USE_MOCK) {
        console.log('Mock create participant:', participant);
        return { id: 'mock-' + Date.now(), ...participant };
      }
      const { data } = await api.post('/users', participant);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};

export const useUpdateParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => {
      if (USE_MOCK) {
        console.log('Mock update participant:', id, data);
        return { id, ...data };
      }
      const { data: res } = await api.put(`/users/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};

export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        console.log('Mock delete participant:', id);
        return;
      }
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};
