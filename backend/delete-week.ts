import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Target: Jan 19 2026
  // We look for a week that starts roughly then.
  // Using a small range to be safe against timezone offsets if any, but exact date match is preferred if stored as 00:00:00.
  // Frontend uses local setHours(0,0,0,0).
  // "2026-01-19"
  
  const targetDate = new Date('2026-01-19T00:00:00.000Z'); 
  // Wait, if it was saved with local timezone offset, it might be different in UTC?
  // Let's search by range.
  const start = new Date('2026-01-18T12:00:00.000Z');
  const end = new Date('2026-01-20T12:00:00.000Z');

  console.log('Searching for week between', start, 'and', end);

  const weeks = await prisma.semana.findMany({
    where: {
      dataInicio: {
        gte: start,
        lte: end
      }
    }
  });

  console.log(`Found ${weeks.length} weeks.`);

  for (const week of weeks) {
    console.log(`Deleting week: ${week.id} - ${week.descricao} (${week.dataInicio})`);
    
    const deletedDesignations = await prisma.designacao.deleteMany({
      where: { semanaId: week.id }
    });
    console.log(`Deleted ${deletedDesignations.count} designations.`);

    await prisma.semana.delete({
      where: { id: week.id }
    });
    console.log('Week deleted successfully.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
