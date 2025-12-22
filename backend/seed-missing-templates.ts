
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.parteTemplate.findFirst({
    where: { titulo: 'Oração Inicial' }
  });

  if (!existing) {
    console.log('Creating Oração Inicial template...');
    await prisma.parteTemplate.create({
      data: {
        id: 'tpl_oracao_inicial',
        titulo: 'Oração Inicial',
        secao: 'geral',
        tempoPadrao: 5,
        temObservacao: false,
        temTempo: false
      }
    });
    console.log('Created!');
  } else {
    console.log('Oração Inicial already exists.');
  }

  // Check for Presidente
  const existingPresident = await prisma.parteTemplate.findFirst({
    where: { titulo: 'Presidente' }
  });

  if (!existingPresident) {
    console.log('Creating Presidente template...');
    await prisma.parteTemplate.create({
      data: {
        id: 'tpl_presidente',
        titulo: 'Presidente',
        secao: 'geral',
        tempoPadrao: 0,
        temObservacao: false,
        temTempo: false,
        generoExclusivo: 'ANCIAO' // Usually restricted to elders
      }
    });
    console.log('Created Presidente!');
  } else {
    console.log('Presidente already exists.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
