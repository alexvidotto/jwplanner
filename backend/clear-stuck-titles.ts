
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.designacao.findMany({
    where: {
      tituloDoTema: 'Discurso Público'
    }
  });

  console.log(`Found ${parts.length} parts with title "Discurso Público".`);

  if (parts.length > 0) {
    const update = await prisma.designacao.updateMany({
      where: {
        tituloDoTema: 'Discurso Público'
      },
      data: {
        tituloDoTema: null // Clear it so it falls back to Template Title
      }
    });
    console.log(`Updated ${update.count} parts.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
