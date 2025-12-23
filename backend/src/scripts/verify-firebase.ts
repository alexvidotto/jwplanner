import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verify() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('Project ID:', projectId);
  console.log('Client Email:', clientEmail);
  console.log('Private Key Length:', privateKey?.length);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing credentials');
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log('Initialized. Listing users...');
    const listUsersResult = await admin.auth().listUsers(1);
    console.log('Successfully listed users:', listUsersResult.users.length);
    process.exit(0);
  } catch (error) {
    console.error('Error verifying firebase:', error);
    process.exit(1);
  }
}

verify();
