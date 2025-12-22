
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dateStr = '2025-12-22';
  const date = new Date(dateStr);
  
  const week = await prisma.semana.findFirst({
    where: {
      dataInicio: date
    },
    include: {
      designacoes: {
        include: {
          parteTemplate: true
        }
      }
    }
  });

  if (!week) {
    console.log('Week not found for date:', dateStr);
    return;
  }

  console.log('Week found:', week.id);
  
  week.designacoes.forEach(d => {
    if (d.parteTemplate.secao === 'tesouros') {
      console.log(`Part ID: ${d.id}`);
      console.log(`  Template ID: ${d.parteTemplateId}`);
      console.log(`  Template Title: "${d.parteTemplate.titulo}"`);
      console.log(`  Designacao Theme (tituloDoTema): "${d.tituloDoTema}"`);
      console.log('---');
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
