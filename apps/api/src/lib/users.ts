import type { UserDto } from "@repo/core";
import { hashPassword, validatePassword, verifyPassword } from "@repo/crypto";
import { eq, users, type Database } from "@repo/db";
import { AppError, unauthenticated, validationError } from "../errors.js";

export type UserRow = typeof users.$inferSelect;

export function toUserDto(user: UserRow): UserDto {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerifiedAt !== null,
    };
}

const PASSWORD_MESSAGES = {
    too_short: "Password is too short",
    too_long: "Password is too long",
    too_common: "Password is too common, choose a different one",
} as const;

/** Rejects passwords that fail the policy (length, common-password list). */
export function assertPasswordAllowed(password: string): void {
    const check = validatePassword(password);
    if (!check.ok) {
        throw validationError(PASSWORD_MESSAGES[check.reason], {
            issues: [{ path: "password", message: PASSWORD_MESSAGES[check.reason] }],
        });
    }
}

let dummyHash: Promise<string> | undefined;

/**
 * Verifying against a throwaway hash when the user does not exist keeps the
 * response time of "unknown email" close to "wrong password".
 */
function getDummyHash(): Promise<string> {
    dummyHash ??= hashPassword("seal-dummy-password-for-timing");
    return dummyHash;
}

/**
 * Checks email and password and returns the user. Wrong email and wrong
 * password are indistinguishable. Unverified email is reported only after the
 * password is proven correct.
 */
export async function verifyCredentials(db: Database, email: string, password: string): Promise<UserRow> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    const valid = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password);
    if (!user || !valid) {
        throw unauthenticated("Invalid email or password");
    }
    if (!user.emailVerifiedAt) {
        throw new AppError("EMAIL_NOT_VERIFIED", "Verify your email address first");
    }
    return user;
}
