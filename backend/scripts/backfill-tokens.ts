
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting token backfill...');

  // Find all designations without a token
  const designations = await prisma.designacao.findMany({
    where: {
      tokenConfirmacao: null,
    },
  });

  console.log(`Found ${designations.length} designations without token.`);

  for (const d of designations) {
    const token = crypto.randomUUID();
    await prisma.designacao.update({
      where: { id: d.id },
      data: { tokenConfirmacao: token },
    });
  }

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
