import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
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

/** Either the database or a transaction, so helpers work inside both. */
export type Executor = PgDatabase<NodePgQueryResultHKT, typeof schema>;
