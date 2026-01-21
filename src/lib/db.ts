import Database from "better-sqlite3";

import { mkdirSync } from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const file = path.join(process.cwd(), "data", "wardrobe.db");
  mkdirSync(path.dirname(file), { recursive: true });

  const next = new Database(file);
  next.pragma("journal_mode = WAL");

  next.exec(`
    CREATE TABLE IF NOT EXISTS garments (
      id TEXT PRIMARY KEY,
      name TEXT,
      completionStatus TEXT NOT NULL,
      photos TEXT NOT NULL,
      attributes TEXT NOT NULL,
      intakeSessionId TEXT,
      intakeOrder INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  next.exec(`
    CREATE INDEX IF NOT EXISTS idx_garments_updatedAt ON garments(updatedAt);
  `);

  db = next;
  return next;
}
