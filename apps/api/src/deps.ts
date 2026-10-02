import { EnvKeyProvider, type KeyProvider } from "@repo/crypto";
import { createDb, type Database } from "@repo/db";
import { createEmailSender, type EmailSender } from "./email/sender.js";
import { loadEnv, type Env } from "./env.js";

export interface Deps {
  env: Env;
  db: Database;
  keyProvider: KeyProvider;
  email: EmailSender;
}

export function createDeps(env: Env = loadEnv()): Deps {
  return {
    env,
    db: createDb(env.DATABASE_URL),
    keyProvider: EnvKeyProvider.fromEnv({
      MASTER_KEYS: env.MASTER_KEYS,
      MASTER_KEY_CURRENT: env.MASTER_KEY_CURRENT,
    }),
    email: createEmailSender(env.NODE_ENV),
  };
}
