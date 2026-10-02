import { hash, verify } from "@node-rs/argon2";

export const PASSWORD_MIN_LENGTH = 10;
/** Upper bound so a huge input cannot be used to burn CPU/memory. */
export const PASSWORD_MAX_LENGTH = 1024;

/**
 * Argon2id (the library default algorithm) with explicit parameters that meet
 * the minimum of memory 19 MiB, 2 iterations, parallelism 1.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Small list of very common passwords that are long enough to pass the length
 * check. Compared case-insensitively.
 */
const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678910",
  "123456789012",
  "0123456789",
  "1q2w3e4r5t",
  "1qaz2wsx3edc",
  "qwertyuiop",
  "qwertyuiop1",
  "qwerty1234",
  "qwerty12345",
  "qwerty123456",
  "asdfghjkl1",
  "asdfghjklqwerty",
  "zxcvbnm123",
  "password12",
  "password123",
  "password1234",
  "password12345",
  "password123456",
  "passw0rd123",
  "p@ssw0rd123",
  "p@ssword123",
  "letmein123",
  "letmein1234",
  "welcome123",
  "welcome1234",
  "admin12345",
  "admin123456",
  "administrator",
  "iloveyou123",
  "iloveyou1234",
  "monkey1234",
  "dragon1234",
  "football123",
  "baseball123",
  "superman123",
  "trustno1234",
  "changeme123",
  "abcdefghij",
  "abcd123456",
  "abc1234567",
  "aaaaaaaaaa",
  "1111111111",
  "0000000000",
  "secretsecret",
  "mysecretpassword",
]);

export type PasswordCheck =
  | { ok: true }
  | { ok: false; reason: "too_short" | "too_long" | "too_common" };

export function validatePassword(password: string): PasswordCheck {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, reason: "too_short" };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: "too_common" };
  }
  return { ok: true };
}

/** Returns a PHC-format argon2id hash (salt and parameters are embedded). */
export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Returns false for a wrong password or a malformed hash; never throws. */
export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
