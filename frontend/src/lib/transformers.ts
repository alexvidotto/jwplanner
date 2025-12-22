
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDateRange = (date: Date) => {
  // Ensure we are working with the Monday of the week
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  const endDate = addDays(startDate, 6);

  const startMonth = format(startDate, 'M');
  const endMonth = format(endDate, 'M');

  if (startMonth === endMonth) {
    return `${format(startDate, 'd')}–${format(endDate, 'd')} de ${capitalize(format(endDate, 'MMMM', { locale: ptBR }))} `;
  } else {
    return `${format(startDate, 'd')} de ${capitalize(format(startDate, 'MMM', { locale: ptBR }))} – ${format(endDate, 'd')} de ${capitalize(format(endDate, 'MMM', { locale: ptBR }))}`;
  }
};

export const transformWeeksToFrontend = (weeksData: any[]) => {
  if (!weeksData) return [];

  return weeksData.map(week => {
    return transformWeekToFrontend(week);
  });
};

export const transformWeekToFrontend = (week: any) => {
  const sectionsMap: Record<string, any> = {
    tesouros: { id: 'tesouros', title: 'Tesouros da Palavra', parts: [], color: 'bg-gray-600', allowAdd: false },
    fsm: { id: 'fsm', title: 'Faça Seu Melhor', parts: [], color: 'bg-yellow-600', allowAdd: true },
    nvc: { id: 'nvc', title: 'Nossa Vida Cristã', parts: [], color: 'bg-red-700', allowAdd: true },
  };

  let openingPrayerId = null;
  let openingPrayerStatus = 'PENDENTE';
  let openingPrayerPartId = null;
  let openingPrayerTemplateId = null;

  week.designacoes?.forEach((d: any) => {
    const template = d.parteTemplate;
    if (!template) return;

    const part = {
      id: d.id,
      templateId: template.id,
      title: d.tituloDoTema || template.titulo,
      templateTitle: template.titulo, // Store original template title for sorting
      time: (d.tempo || template.tempoPadrao || 5) + ' min',
      assignedTo: d.titularId,
      status: d.status,
      assistantId: (!template.requerLeitor && d.ajudanteId) ? d.ajudanteId : null,
      readerId: (template.requerLeitor && d.ajudanteId) ? d.ajudanteId : null,
      assistantStatus: 'PENDENTE',
      readerStatus: 'PENDENTE',
      observation: d.observacao || '',
      requiresAssistant: template.requerAjudante,
      requiresReader: template.requerLeitor || false,
      hasObservation: template.temObservacao || false,
      hasTime: template.temTempo ?? true,
      token: d.tokenConfirmacao
    };

    // Extract Opening Prayer
    if (part.title === 'Oração Inicial') {
      openingPrayerId = part.assignedTo;
      openingPrayerStatus = part.status;
      openingPrayerPartId = part.id;
      openingPrayerTemplateId = part.templateId;
      return; // Skip adding to section
    }

    const sectionId = template.secao;
    if (sectionsMap[sectionId]) {
      sectionsMap[sectionId].parts.push(part);
    }
  });

  const startDate = new Date(week.dataInicio);

  // Fixed order for Tesouros
  const tesourosOrder = ['discurso', 'joias espirituais', 'leitura da biblia'];
  const normalizeTitle = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  sectionsMap.tesouros.parts.sort((a: any, b: any) => {
    // Try sorting by templateTitle first (stable), fallback to title
    const titleA = normalizeTitle(a.templateTitle || a.title);
    const titleB = normalizeTitle(b.templateTitle || b.title);

    const indexA = tesourosOrder.findIndex(t => titleA.includes(t));
    const indexB = tesourosOrder.findIndex(t => titleB.includes(t));

    // If both are known, sort by order
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;

    if (indexA !== -1) return -1; // A is known, B is unknown (should B be before or after?)
    if (indexB !== -1) return 1;  // B is known

    return 0;
  });

  // Sort NVC section to ensure Oração Final is last and Bible Study is second to last
  sectionsMap.nvc.parts.sort((a: any, b: any) => {
    const isFinalPrayerA = a.title === 'Oração Final';
    const isFinalPrayerB = b.title === 'Oração Final';

    if (isFinalPrayerA) return 1;
    if (isFinalPrayerB) return -1;

    // Check for Bible Study (Estudo Bíblico)
    const isBibleStudyA = a.templateTitle?.includes('Estudo') || a.title.includes('Estudo');
    const isBibleStudyB = b.templateTitle?.includes('Estudo') || b.title.includes('Estudo');

    if (isBibleStudyA && isBibleStudyB) return 0;
    if (isBibleStudyA) return 1; // Bible Study goes after normal parts (but before Prayer)
    if (isBibleStudyB) return -1;

    return 0;
  });

  return {
    id: week.id,
    dateLabel: formatDateRange(startDate),
    date: startDate,
    presidentId: week.presidenteId,
    presidentStatus: week.statusPresidente || 'PENDENTE',
    openingPrayerId,
    openingPrayerStatus,
    openingPrayerPartId,
    openingPrayerTemplateId,
    sections: [sectionsMap.tesouros, sectionsMap.fsm, sectionsMap.nvc],
    isCanceled: week.tipo === 'NO_MEET',
    description: week.descricao || ''
  };
};

export const generateVirtualWeek = (date: Date, partTemplates: any[]) => {
  const sectionsMap: Record<string, any> = {
    tesouros: { id: 'tesouros', title: 'Tesouros da Palavra', parts: [], color: 'bg-gray-600', allowAdd: false },
    fsm: { id: 'fsm', title: 'Faça Seu Melhor', parts: [], color: 'bg-yellow-600', allowAdd: true },
    nvc: { id: 'nvc', title: 'Nossa Vida Cristã', parts: [], color: 'bg-red-700', allowAdd: true },
  };

  let openingPrayerId = null;
  let openingPrayerStatus = 'PENDENTE';
  let openingPrayerPartId = null;
  let openingPrayerTemplateId = null;

  // Populate from templates
  partTemplates.forEach(tpl => {
    // Extract Opening Prayer
    if (tpl.title === 'Oração Inicial') {
      openingPrayerId = null;
      openingPrayerStatus = 'PENDENTE';
      openingPrayerPartId = `virtual-${tpl.id}-${Date.now()}`;
      openingPrayerTemplateId = tpl.id;
      return; // Skip adding to section
    }

    const sectionId = tpl.section;
    if (sectionsMap[sectionId]) {
      sectionsMap[sectionId].parts.push({
        id: `virtual-${tpl.id}-${Date.now()}`,
        templateId: tpl.id,
        title: tpl.title,
        templateTitle: tpl.title,
        time: tpl.defaultTime,
        assignedTo: null,
        status: 'PENDENTE',
        assistantId: null,
        readerId: null,
        observation: '',
        requiresAssistant: tpl.requiresAssistant,
        requiresReader: tpl.requiresReader,
        hasObservation: tpl.hasObservation,
        hasTime: tpl.hasTime ?? true,
      });
    }
  });

  // Fixed order for Tesouros
  const tesourosOrder = ['discurso', 'joias espirituais', 'leitura da biblia'];
  const normalizeTitle = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  sectionsMap.tesouros.parts.sort((a: any, b: any) => {
    const titleA = normalizeTitle(a.templateTitle || a.title);
    const titleB = normalizeTitle(b.templateTitle || b.title);

    const indexA = tesourosOrder.findIndex(t => titleA.includes(t));
    const indexB = tesourosOrder.findIndex(t => titleB.includes(t));

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });


  // Sort NVC section to ensure Oração Final is last
  sectionsMap.nvc.parts.sort((a: any, b: any) => {
    const isFinalPrayerA = a.title === 'Oração Final';
    const isFinalPrayerB = b.title === 'Oração Final';

    if (isFinalPrayerA) return 1;
    if (isFinalPrayerB) return -1;

    // Check for Bible Study (Estudo Bíblico)
    const isBibleStudyA = a.templateTitle?.includes('Estudo') || a.title.includes('Estudo');
    const isBibleStudyB = b.templateTitle?.includes('Estudo') || b.title.includes('Estudo');

    if (isBibleStudyA && isBibleStudyB) return 0;
    if (isBibleStudyA) return 1;
    if (isBibleStudyB) return -1;

    return 0;
  });

  return {
    id: null, // Virtual
    dataInicio: date.toISOString(), // Keep raw date for saving
    dateLabel: formatDateRange(date),
    date: date,
    presidentId: null,
    presidentStatus: 'PENDENTE',
    openingPrayerId,
    openingPrayerStatus,
    openingPrayerPartId,
    openingPrayerTemplateId,
    sections: [sectionsMap.tesouros, sectionsMap.fsm, sectionsMap.nvc],
    isCanceled: false // Default to false for virtual/new weeks
  };
};

export const transformParticipantsToFrontend = (users: any[]) => {
  return users.map(u => {
    let gender = 'PH';
    if (u.privilegio === 'PUB_MULHER') gender = 'PM';

    // Backend: habilidades has { parteTemplateId: ... }
    // Frontend expects array of strings (templateIds)
    const abilities = u.habilidades?.map((h: any) =>
      h.isLeitor ? `${h.parteTemplateId}_reader` : h.parteTemplateId
    ) || [];

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
    hasObservation: p.temObservacao,
    hasTime: p.temTempo,
    allowedPrivileges: p.generoExclusivo ? [p.generoExclusivo] : ['ANY'] // Approximate logic
  }));
};
