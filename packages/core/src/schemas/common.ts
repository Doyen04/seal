import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 1024;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

/** For choosing a new password (signup, reset). Common-password check is server-side. */
export const newPasswordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH);

/** For logging in. Deliberately lenient so older passwords keep working. */
export const currentPasswordSchema = z.string().min(1).max(PASSWORD_MAX_LENGTH);

export const nameSchema = z.string().trim().min(1).max(100);

/** Opaque token pasted from an email link. */
export const emailTokenSchema = z.string().min(20).max(200);
