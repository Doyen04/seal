import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export interface CreateDbOptions {
  /** Max connections in this process. Keep small on serverless. */
  max?: number;
}

/** Creates a Drizzle client. Use the Neon pooled connection string. */
export function createDb(connectionString: string, options: CreateDbOptions = {}) {
  const pool = new Pool({ connectionString, max: options.max ?? 5 });
  const db = drizzle(pool, { schema });
  return Object.assign(db, { pool });
}

export type Database = ReturnType<typeof createDb>;
