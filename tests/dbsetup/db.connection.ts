import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";

config();

export type ConnectionOptions = {
  max?: number;                 // Maximum number of connections in the pool
  idle_timeout?: number;        // Maximum time a connection can be idle before it is closed
  connect_timeout?: number;
};

export type DatabaseConnection = {
  client: postgres.Sql;
  db: ReturnType<typeof drizzle>;
};

/**
 * Create a database connection
 * envVar - Environment variable name (default: TEST_DATABASE_URL)
 * options - Connection options
 * Database connection with client and drizzle instance
 */
export function createConnection(
  envVar: string = "TEST_DATABASE_URL",
  options: ConnectionOptions = {}
): DatabaseConnection {
  const url = process.env[envVar];
  if (!url) {
    throw new Error(`${envVar} not found in environment variables`);
  }

  const client = postgres(url, {
    max: 1,                      // Maximum number of connections in the pool 
    idle_timeout: 20,            // timeout for idle connections is 20 seconds
    connect_timeout: 10,         // timeout for connection is 10 seconds
    ...options,
  });
  return {
    client,
    db: drizzle(client),
  };
}

/**
 * Close a database connection
 */
export async function closeConnection(client: postgres.Sql): Promise<void> {
  await client.end();
}
