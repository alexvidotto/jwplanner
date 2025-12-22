
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.parteTemplate.findMany();
  console.log('Templates found:', templates.length);
  templates.forEach(t => {
    console.log(`ID: ${t.id} | Title: "${t.titulo}" | Section: ${t.secao}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
