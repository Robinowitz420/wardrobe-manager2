import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Use the same env var pattern as the app
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

const characterBalls = [
  { title: "Rainbow Realm Rendezvous", date: "2026-03-17" },
  { title: "Fool's Paradise", date: "2026-03-31" },
  { title: "Religious Renaissance", date: "2026-04-14" },
  { title: "Superhero Soiree", date: "2026-04-28" },
  { title: "Fiesta of Fabulosity", date: "2026-05-05" },
  { title: "Career Carousel", date: "2026-05-19" },
  { title: "Meow Mansion", date: "2026-06-02" },
  { title: "Mermaid Cove", date: "2026-06-16" },
  { title: "Gala of the Galaxies", date: "2026-06-30" },
  { title: "Movie Theater", date: "2026-07-07" },
  { title: "Twin City", date: "2026-07-21" },
  { title: "Inner Child Fantasyland", date: "2026-08-04" },
  { title: "Renegade Ring Circus", date: "2026-08-18" },
  { title: "Gathering of the Gurus", date: "2026-09-01" },
  { title: "Rockstar Rager", date: "2026-09-15" },
  { title: "Ancestor Awakening", date: "2026-09-29" },
  { title: "Everybody's Birthday Bash", date: "2026-10-13" },
  { title: "Dance of the Dark Side", date: "2026-10-27" },
  { title: "People of Peace Rally", date: "2026-11-10" },
  { title: "The Banquet", date: "2026-11-24" },
  { title: "Royal Reception", date: "2026-12-08" },
  { title: "Apocalypse Party", date: "2026-12-22" },
];

const description = `Character Ball - A dress up party where you dress as characters within the theme!

Running it means:
• Promoting the event
• Getting accessories ready
• Being there to assist guests with clothing rentals and try-ons`;

async function seedEvents() {
  console.log("Seeding Character Ball events...\n");

  for (const event of characterBalls) {
    const now = new Date().toISOString();
    
    const docRef = await db.collection("events").add({
      title: `Character Ball: ${event.title}`,
      date: event.date,
      startTime: "19:00",
      endTime: "23:00",
      description,
      location: "Before & Afters",
      capacity: null,
      signups: [],
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✓ Created: ${event.title} (${event.date}) - ID: ${docRef.id}`);
  }

  console.log("\n✅ Done! Created 22 Character Ball events.");
}

seedEvents().catch(console.error);
