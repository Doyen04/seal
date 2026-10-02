import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    MASTER_KEYS: z.string().min(1),
    MASTER_KEY_CURRENT: z.string().min(1),
    WEB_ORIGIN: z.url(),
    EMAIL_FROM: z.string().min(1).default("seal <no-reply@localhost>"),
    CRON_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Thrown for bad configuration. Its message only ever contains variable names. */
export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigError";
    }
}

/**
 * Validates environment variables. The error lists variable names only,
 * never their values.
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
    const result = envSchema.safeParse(source);
    if (!result.success) {
        const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))];
        throw new ConfigError(`Invalid or missing environment variables: ${names.join(", ")}`);
    }
    return result.data;
}
