
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.parteTemplate.findFirst({
    where: { OR: [{ titulo: 'Discurso Público' }, { id: 'tpl_discurso' }] }
  });

  if (template) {
    console.log(`Found template: ${template.titulo} (${template.id})`);
    if (template.titulo !== 'Discurso') {
      await prisma.parteTemplate.update({
        where: { id: template.id },
        data: { titulo: 'Discurso' }
      });
      console.log('Updated title to "Discurso"');
    } else {
      console.log('Title is already "Discurso"');
    }
  } else {
    console.log('Template not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
