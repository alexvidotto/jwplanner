import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_PART_TEMPLATES = [
  { id: 'tpl_discurso', title: 'Discurso Público', secao: 'tesouros', tempoPadrao: 30, requerAjudante: false },
  { id: 'tpl_joias', title: 'Jóias Espirituais', secao: 'tesouros', tempoPadrao: 10, requerAjudante: false },
  { id: 'tpl_leitura', title: 'Leitura da Bíblia', secao: 'tesouros', tempoPadrao: 4, requerAjudante: false },

  { id: 'tpl_iniciando', title: 'Iniciando Conversas', secao: 'fsm', tempoPadrao: 3, requerAjudante: true },
  { id: 'tpl_cultivando', title: 'Cultivando o Interesse', secao: 'fsm', tempoPadrao: 4, requerAjudante: true },
  { id: 'tpl_fazendo', title: 'Fazendo Discípulos', secao: 'fsm', tempoPadrao: 5, requerAjudante: true },
  { id: 'tpl_crencas', title: 'Explique suas Crenças', secao: 'fsm', tempoPadrao: 5, requerAjudante: true },

  { id: 'tpl_necessidades', title: 'Necessidades Locais', secao: 'nvc', tempoPadrao: 15, requerAjudante: false },
  { id: 'tpl_estudo', title: 'Estudo Bíblico', secao: 'nvc', tempoPadrao: 30, requerAjudante: true },
  { id: 'tpl_oracao', title: 'Oração Final', secao: 'nvc', tempoPadrao: 5, requerAjudante: false, temTempo: false },
];

async function main() {
  console.log('Seeding data...');

  // Upsert Templates
  for (const tpl of INITIAL_PART_TEMPLATES) {
    await prisma.parteTemplate.upsert({
      where: { id: tpl.id },
      update: {
        titulo: tpl.title,
        secao: tpl.secao,
        requerAjudante: tpl.requerAjudante,
        tempoPadrao: tpl.tempoPadrao,
        temTempo: (tpl as any).temTempo ?? true,
      },
      create: {
        id: tpl.id,
        titulo: tpl.title,
        secao: tpl.secao,
        requerAjudante: tpl.requerAjudante,
        tempoPadrao: tpl.tempoPadrao,
        temTempo: (tpl as any).temTempo ?? true,
      }
    });
  }

  // Create some mocks participants
  const participants = [
    { name: 'Alex Vidotto', privilegio: 'ANCIAO', gender: 'PH', abilities: ['tpl_discurso', 'tpl_leitura', 'tpl_estudo', 'tpl_oracao', 'tpl_necessidades'] },
    // Add more...
  ];

  for (const p of participants) {
    const user = await prisma.participante.upsert({
      where: { email: p.name + '@example.com' }, // Hacky unique check
      update: {},
      create: {
        nome: p.name,
        email: p.name + '@example.com',
        privilegio: p.privilegio as any,
      }
    });

    // Link abilities
    for (const skillId of p.abilities) {
      try {
        await prisma.habilidade.create({
          data: {
            participanteId: user.id,
            parteTemplateId: skillId
          }
        });
      } catch (e) {
        // Ignore duplicates
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
