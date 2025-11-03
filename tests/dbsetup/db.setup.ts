import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Apply migrations to create database schema (create tables using migrations)
 */
export async function setupTestDatabase(db: any): Promise<void> {
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");
  await migrate(db, { migrationsFolder });

  // Ensure required tables exist even if migrator state is out-of-sync
  // (e.g., breakpoints or prior partial runs). These CREATEs are idempotent.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY NOT NULL,
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      password varchar(255) NOT NULL,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id uuid PRIMARY KEY NOT NULL,
      title varchar(255) NOT NULL,
      description text,
      status varchar(20) NOT NULL,
      assignee_id uuid NOT NULL,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL
    );
  `);
}

/**
 * Remove all data from tables
 */
export async function cleanTestDatabase(db: any): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE tasks CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users CASCADE`);
}

/**
 * Drop all tables
 */
export async function teardownTestDatabase(db: any): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS tasks CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
}

