export const MOCK_PART_TEMPLATES = [
  { id: 'tpl_discurso', title: 'Discurso Público', secao: 'tesouros', tempoPadrao: 30, requerAjudante: false, generoExclusivo: 'ANCIAO' },
  { id: 'tpl_joias', title: 'Jóias Espirituais', secao: 'tesouros', tempoPadrao: 10, requerAjudante: false, generoExclusivo: 'ANCIAO' },
  { id: 'tpl_leitura', title: 'Leitura da Bíblia', secao: 'tesouros', tempoPadrao: 4, requerAjudante: false, generoExclusivo: 'PUB_HOMEM' },

  { id: 'tpl_iniciando', title: 'Iniciando Conversas', secao: 'fsm', tempoPadrao: 3, requerAjudante: true, generoExclusivo: null },
  { id: 'tpl_cultivando', title: 'Cultivando o Interesse', secao: 'fsm', tempoPadrao: 4, requerAjudante: true, generoExclusivo: null },
  { id: 'tpl_fazendo', title: 'Fazendo Discípulos', secao: 'fsm', tempoPadrao: 5, requerAjudante: true, generoExclusivo: null },
  { id: 'tpl_crencas', title: 'Explique suas Crenças', secao: 'fsm', tempoPadrao: 5, requerAjudante: true, generoExclusivo: null },

  { id: 'tpl_necessidades', title: 'Necessidades Locais', secao: 'nvc', tempoPadrao: 15, requerAjudante: false, generoExclusivo: 'ANCIAO' },
  { id: 'tpl_estudo', title: 'Estudo Bíblico', secao: 'nvc', tempoPadrao: 30, requerAjudante: true, generoExclusivo: 'ANCIAO' },
  { id: 'tpl_oracao', title: 'Oração Final', secao: 'nvc', tempoPadrao: 5, requerAjudante: false, generoExclusivo: 'PUB_HOMEM' },
];

export const MOCK_PARTICIPANTS = [
  { id: 'p1', nome: 'Alex Vidotto', privilegio: 'ANCIAO', podeDesignar: true, habilidades: [{ parteTemplateId: 'tpl_discurso' }, { parteTemplateId: 'tpl_leitura' }, { parteTemplateId: 'tpl_estudo' }, { parteTemplateId: 'tpl_oracao' }, { parteTemplateId: 'tpl_necessidades' }] },
  { id: 'p2', nome: 'João Silva', privilegio: 'SERVO', podeDesignar: true, habilidades: [{ parteTemplateId: 'tpl_leitura' }, { parteTemplateId: 'tpl_iniciando' }] },
  { id: 'p3', nome: 'Maria Santos', privilegio: 'PUB_MULHER', podeDesignar: true, habilidades: [{ parteTemplateId: 'tpl_iniciando' }, { parteTemplateId: 'tpl_cultivando' }] },
];

export const MOCK_WEEKS = [
  {
    id: 'w1',
    dataInicio: new Date().toISOString(),
    descricao: 'Semana de Teste',
    tipo: 'NORMAL',
    presidenteId: 'p1',
    designacoes: [
      { id: 'd1', parteTemplate: MOCK_PART_TEMPLATES[0], titularId: 'p1', tempo: 30, status: 'CONFIRMADO' },
      { id: 'd2', parteTemplate: MOCK_PART_TEMPLATES[2], titularId: 'p2', tempo: 4, status: 'PENDENTE' },
      { id: 'd3', parteTemplate: MOCK_PART_TEMPLATES[3], titularId: 'p3', ajudanteId: 'p2', tempo: 3, status: 'PENDENTE' }
    ]
  }
];
