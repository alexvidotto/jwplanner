import * as admin from 'firebase-admin';
import { PrismaClient, Role, Privilegio } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env based on ENV_FILE or default to .env
const envFile = process.env.ENV_FILE || '.env';
dotenv.config({ path: path.join(__dirname, '../../', envFile), override: true });

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin User';

  if (!email || !password) {
    console.error('Usage: ts-node src/scripts/create-admin.ts <email> <password> [name]');
    process.exit(1);
  }

  // 1. Initialize Firebase
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Credentials in .env');
    process.exit(1);
  }

  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase App Initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase App:', error);
      process.exit(1);
    }
  }

  console.log(`Creating Admin: ${email} / ${password} / ${name}`);

  let uidAuth = '';

  // 2. Create in Firebase
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    uidAuth = userRecord.uid;
    console.log('Firebase User Created. UID:', uidAuth);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists in Firebase. Fetching UID...');
      const user = await admin.auth().getUserByEmail(email);
      uidAuth = user.uid;
    } else {
      console.error('Error creating Firebase user:', error);
      process.exit(1);
    }
  }

  // 3. Create/Update in Postgres
  try {
    const user = await prisma.participante.upsert({
      where: { email },
      update: {
        role: Role.ADMIN,
        uidAuth, // Link if missing
      },
      create: {
        nome: name,
        email,
        role: Role.ADMIN,
        uidAuth,
        privilegio: Privilegio.ANCIAO, // Admins typically elders?
        podeDesignar: true,
      },
    });
    console.log('Database User Synced:', user);
  } catch (error) {
    console.error('Error syncing Database:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    // process.exit(0); // Optional
  });
