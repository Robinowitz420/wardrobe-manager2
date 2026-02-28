import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account from JSON file directly
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const garmentIds = [
  'a6455ab8-2f32-4396-ba1a-f7c0a67d2f47',
  'e9d516f3-6f28-4c6b-a241-80313f2f2b1a',
];

const batch = db.batch();
let count = 0;

for (const id of garmentIds) {
  const ref = db.collection('garments').doc(id);
  const snap = await ref.get();
  
  if (snap.exists) {
    batch.update(ref, {
      'attributes.state': 'Available',
      'attributes.reservedAt': null,
      'attributes.reservedByToken': null,
      updatedAt: new Date().toISOString(),
    });
    count++;
    console.log(`Queued update for ${id}`);
  } else {
    console.log(`Document ${id} not found`);
  }
}

await batch.commit();
console.log(`\n✅ Unreserved ${count} garments`);
