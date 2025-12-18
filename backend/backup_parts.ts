import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupParts() {
  try {
    const parts = await prisma.parteTemplate.findMany();

    if (parts.length === 0) {
      console.log('No parts found to backup.');
      return;
    }

    // simplistic CSV generation
    const headers = Object.keys(parts[0]).join(',');
    const rows = parts.map(part => {
      return Object.values(part).map(value => {
        if (value === null) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`; // escape quotes
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    // Ensure backups directory exists
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `parts_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, csvContent);

    console.log(`Backup created successfully at: ${filepath}`);
    console.log(`Total records: ${parts.length}`);

  } catch (error) {
    console.error('Error creating backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupParts();
