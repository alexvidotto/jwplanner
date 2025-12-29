
import api from './api';

export interface WolAssignment {
  parteTemplateId: string;
  tituloDoTema?: string;
  observacao?: string;
  tempo?: number;
}

export const getWolWeekContent = async (date: string): Promise<WolAssignment[]> => {
  const response = await api.get<WolAssignment[]>('/wol/content', {
    params: { date }
  });
  return response.data;
};
