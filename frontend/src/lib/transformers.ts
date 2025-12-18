import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const transformWeeksToFrontend = (weeksData: any[]) => {
  if (!weeksData) return [];

  return weeksData.map(week => {
    const sectionsMap: Record<string, any> = {
      tesouros: { id: 'tesouros', title: 'Tesouros da Palavra', parts: [], color: 'bg-gray-600', allowAdd: false },
      fsm: { id: 'fsm', title: 'Faça Seu Melhor', parts: [], color: 'bg-yellow-600', allowAdd: true },
      nvc: { id: 'nvc', title: 'Nossa Vida Cristã', parts: [], color: 'bg-red-700', allowAdd: true },
    };

    let openingPrayerId = null;
    let openingPrayerStatus = 'PENDENTE';

    // Check if week.presidenteId is present and handled in App.tsx usage of this data
    // Yes, returned object has presidentId.

    week.designacoes?.forEach((d: any) => {
      const template = d.parteTemplate;
      if (!template) return;

      const part = {
        id: d.id,
        templateId: template.id,
        title: d.tituloDoTema || template.titulo,
        time: (d.tempo || template.tempoPadrao || 5) + ' min',
        assignedTo: d.titularId,
        status: d.status,
        assistantId: d.ajudanteId,
        assistantStatus: 'PENDENTE',
        description: '',
        requiresAssistant: template.requerAjudante,
        requiresReader: false,
      };

      const sectionId = template.secao;
      if (sectionsMap[sectionId]) {
        sectionsMap[sectionId].parts.push(part);
      }
    });

    return {
      id: week.id,
      dateLabel: format(new Date(week.dataInicio), "d 'de' MMMM", { locale: ptBR }),
      presidentId: week.presidenteId,
      presidentStatus: 'PENDENTE',
      openingPrayerId: openingPrayerId,
      openingPrayerStatus: openingPrayerStatus,
      sections: [sectionsMap.tesouros, sectionsMap.fsm, sectionsMap.nvc],
      isCanceled: false
    };
  });
};

export const transformParticipantsToFrontend = (users: any[]) => {
  return users.map(u => {
    let gender = 'PH';
    if (u.privilegio === 'PUB_MULHER') gender = 'PM';

    // Backend: habilidades has { parteTemplateId: ... }
    // Frontend expects array of strings (templateIds)
    const abilities = u.habilidades?.map((h: any) => h.parteTemplateId) || [];

    return {
      id: u.id,
      name: u.nome,
      type: u.privilegio,
      gender: gender,
      active: u.podeDesignar,
      phone: u.telefone || '',
      abilities: abilities
    };
  });
};

export const transformPartsToFrontend = (parts: any[]) => {
  return parts.map(p => ({
    id: p.id,
    title: p.titulo,
    defaultTime: (p.tempoPadrao || 5) + ' min',
    section: p.secao,
    requiresAssistant: p.requerAjudante,
    requiresReader: p.requerLeitor,
    allowedPrivileges: p.generoExclusivo ? [p.generoExclusivo] : ['ANY'] // Approximate logic
  }));
};
