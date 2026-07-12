import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);

async function testDatabase(dbId) {
  console.log(`Testing database ID: "${dbId || '(default)'}"...`);
  try {
    const db = getFirestore(app, dbId);
    const snap = await getDocs(query(collection(db, 'appointments'), limit(1)));
    console.log(`✅ Success for "${dbId || '(default)'}": found ${snap.size} documents.`);
    return true;
  } catch (error) {
    console.log(`❌ Failed for "${dbId || '(default)'}":`, error.message);
    return false;
  }
}

async function run() {
  await testDatabase(undefined);
  await testDatabase('applet-d7843b1f-1bbb-4d52-a6af-b13caf5ef892');
  await testDatabase('d7843b1f-1bbb-4d52-a6af-b13caf5ef892');
}

run().catch(console.error);
