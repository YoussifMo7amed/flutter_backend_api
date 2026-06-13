import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initFirebase = () => {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (!serviceAccountPath) {
      console.warn('Firebase Warning: FIREBASE_SERVICE_ACCOUNT_PATH not provided in .env');
      return;
    }

    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Firebase Warning: Service account file not found at ${absolutePath}`);
      return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
};

export const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    return null;
  }
  return admin;
};