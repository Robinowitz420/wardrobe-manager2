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

// Weekly recurring events by day
const weeklyEvents: { day: number; title: string; startTime: string; endTime: string; description: string }[] = [
  // Monday
  { day: 1, title: "Movie Theater", startTime: "02:00", endTime: "08:00", description: "Stay tuned for the movie picks each week, from cult classics to mainstream movies to local filmmaker presentations" },
  { day: 1, title: "Yoga Queen", startTime: "08:00", endTime: "14:00", description: "Stretching jeb" },
  { day: 1, title: "Off-S Hours - Masterminding", startTime: "14:00", endTime: "20:00", description: "Masterminding our own business" },
  { day: 1, title: "Live Music / Rockstar Roulette", startTime: "20:00", endTime: "02:00", description: "With a genre wheel to guide us and musicians to play it, let's let it rock!" },
  
  // Tuesday
  { day: 2, title: "Freeeee Style Jamboree", startTime: "02:00", endTime: "08:00", description: "Let's get weird and see just how free and fabulous we can be" },
  { day: 2, title: "British Tea Party & Foot Spa", startTime: "08:00", endTime: "14:00", description: "Sip hot tea, give and receive foot massages, and speak in British accents" },
  { day: 2, title: "Tututuesday, Tattoosday Toothday", startTime: "14:00", endTime: "20:00", description: "Never too too much! Enjoy a rotation of tattoo artists, tooth swag opps, and tutu making technique" },
  { day: 2, title: "THE CHARACTER BALL", startTime: "20:00", endTime: "02:00", description: "Celebrate Tuesdays! Dress up time, character development, trend inventions, personal reinventions, style revolutions" },
  
  // Wednesday
  { day: 3, title: "Crown Cult", startTime: "02:00", endTime: "08:00", description: "Queens n Kings and Castle Creatures, rewrite the Royal rules, leadership lore and magical mythology" },
  { day: 3, title: "Guru Dojo", startTime: "08:00", endTime: "14:00", description: "Podcasts, YouTube vids, divinations & live talks for a spectrum of inspiration and aligned guidance" },
  { day: 3, title: "Off-S Hours - WERK!", startTime: "14:00", endTime: "20:00", description: "Yas honey. Meetings. Get er done." },
  { day: 3, title: "Comedy, Cypher & Crafting", startTime: "20:00", endTime: "02:00", description: "With laughter, loopers and love, hone your crafts of choice" },
  
  // Thursday
  { day: 4, title: "Closet Karaoke!", startTime: "02:00", endTime: "08:00", description: "Get your diva on, dress up the part. Spotlight on u!" },
  { day: 4, title: "Off-S Hours - Company Calls", startTime: "08:00", endTime: "14:00", description: "Crew collaboration celebration elevation" },
  { day: 4, title: "Skillshare Sessions", startTime: "14:00", endTime: "20:00", description: "Learn or teach something random! Probably both." },
  { day: 4, title: "GLAM GAME NITE", startTime: "20:00", endTime: "02:00", description: "We're remixing the games and game shows we know and making up GLAM new ones" },
  
  // Friday
  { day: 5, title: "Sparkle Sessions", startTime: "02:00", endTime: "08:00", description: "Bedazzle your heart out from Starlight to Sunrise. More sparkles the better." },
  { day: 5, title: "French Friday / Mandatory Massage", startTime: "08:00", endTime: "14:00", description: "Do not pass go without a massage! Go with a pro, swap with a stylish stranger, learn technique, heal. Speak French!" },
  { day: 5, title: "Getting Ready Ritual", startTime: "14:00", endTime: "20:00", description: "Getting ready is the main event. Hair, makeup, nails, calendars... Let's prepare for the weekend and our whole lives in general" },
  { day: 5, title: "OFFICIAL BEFORES - Photo Shoot Fantasy", startTime: "20:00", endTime: "02:00", description: "With guest photographers and snazzy backdrops, get your next glam gram drop" },
  
  // Saturday
  { day: 6, title: "Closet Cabaret", startTime: "02:00", endTime: "08:00", description: "From curation in drag to burlesque to speakeasy starlets, the show must go on and on and on" },
  { day: 6, title: "Halfway House Party!", startTime: "08:00", endTime: "14:00", description: "1/2hr house sets keep the energy spicy fresh" },
  { day: 6, title: "Soul Upcycle", startTime: "14:00", endTime: "20:00", description: "Give clothes new life! With designers and cutting edge visionaries, embark on new projects" },
  { day: 6, title: "OFFICIAL BEFORES - Beauty, Booty, Bangs & Bangers", startTime: "20:00", endTime: "02:00", description: "HMU for the HMU party! Shake ya beauty" },
  
  // Sunday
  { day: 0, title: "StageWideOpen", startTime: "02:00", endTime: "08:00", description: "Open stage for all performances" },
  { day: 0, title: "Before & Afters Radio", startTime: "08:00", endTime: "14:00", description: "Tune in to the B&A radio show" },
  { day: 0, title: "The AfterAfterlife", startTime: "14:00", endTime: "20:00", description: "Sunday afternoon vibes" },
];

// Generate dates for the next 12 weeks starting from next Monday
function getNextOccurrences(dayOfWeek: number, weeksAhead: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let week = 0; week < weeksAhead; week++) {
    const targetDate = new Date(today);
    const currentDay = targetDate.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    targetDate.setDate(today.getDate() + daysUntilTarget + (week * 7));
    
    // Only include dates in the future
    if (targetDate > today) {
      dates.push(targetDate.toISOString().split('T')[0]);
    }
  }
  
  return dates;
}

async function seedWeeklyEvents() {
  console.log("Seeding weekly Shiftmasters events...\n");
  console.log("Before&Afters Shiftmasters drafter!");
  console.log("Weekly flow schedule: Members join to build a simulation of 24 hour culture and share in community headship.\n");
  console.log("Participation: You pick one weekly time slot to plug into and cocreate! Out of those, you agree to be physically present at two - at least one as a leader and one as a supporter.\n\n");

  let totalCreated = 0;

  for (const event of weeklyEvents) {
    const dates = getNextOccurrences(event.day, 12);
    
    for (const date of dates) {
      const now = new Date().toISOString();
      
      const docRef = await db.collection("events").add({
        title: event.title,
        date: date,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
        location: "Before & Afters",
        capacity: null,
        signups: [],
        createdAt: now,
        updatedAt: now,
      });
      
      totalCreated++;
      console.log(`✓ Created: ${event.title} (${date}) - ID: ${docRef.id}`);
    }
  }

  console.log(`\n✅ Done! Created ${totalCreated} weekly recurring events (12 weeks worth).`);
}

seedWeeklyEvents().catch(console.error);
