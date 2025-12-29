
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tpls = await prisma.parteTemplate.findMany();
  console.log(JSON.stringify(tpls, null, 2));
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
