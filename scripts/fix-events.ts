import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
  process.exit(1);
}

let svc: any;
try {
  svc = JSON.parse(raw);
} catch {
  console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

initializeApp({
  credential: cert(svc),
});

const db = getFirestore();

async function fixEvents() {
  console.log("Fixing events...\n");

  // 1. Remove anonymous signups from all events
  const eventsSnapshot = await db.collection("events").get();
  let removedCount = 0;
  let capacitySetCount = 0;

  for (const doc of eventsSnapshot.docs) {
    const event = doc.data();
    const signups = event.signups || [];
    
    // Filter out anonymous signups (name is "Anonymous" or empty)
    const filteredSignups = signups.filter((s: any) => 
      s.name && s.name !== "Anonymous" && s.name.trim() !== ""
    );

    const needsUpdate = filteredSignups.length !== signups.length || !event.capacity;

    if (needsUpdate) {
      const updates: any = { updatedAt: new Date().toISOString() };
      
      if (filteredSignups.length !== signups.length) {
        updates.signups = filteredSignups;
        console.log(`✓ Removed ${signups.length - filteredSignups.length} anonymous signup(s) from: ${event.title} (${event.date})`);
        removedCount++;
      }

      // Set capacity to 1 if not set
      if (!event.capacity) {
        updates.capacity = 1;
        capacitySetCount++;
      }

      await doc.ref.update(updates);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   - Removed anonymous signups from ${removedCount} events`);
  console.log(`   - Set capacity=1 on ${capacitySetCount} events`);
}

fixEvents().catch(console.error);
