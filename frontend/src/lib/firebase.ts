import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const shouldMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// let app;
let authExports;

if (shouldMock) {
  console.log('Mocking Firebase Auth');
  // Create a dummy auth object to prevent import crashes
  authExports = {} as any;
} else {
  const app = initializeApp(firebaseConfig);
  authExports = getAuth(app);
}

export const auth = authExports;
