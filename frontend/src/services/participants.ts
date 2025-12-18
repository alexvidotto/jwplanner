import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface Participante {
  id: string;
  nome: string;
  email: string;
  privilegio: string;
  podeDesignar: boolean;
}

export const useParticipants = () => {
  return useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const { data } = await api.get<Participante[]>('/users');
      return data;
    },
  });
};

export const useCreateParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newParticipant: Partial<Participante>) => {
      const { data } = await api.post('/users', newParticipant);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
};
