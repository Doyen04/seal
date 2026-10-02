import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type TokenKind = "service" | "device" | "session" | "email";

const PREFIXES: Record<TokenKind, string> = {
    service: "seal_live_",
    device: "seald_",
    session: "",
    email: "",
};

export interface GeneratedToken {
    /** Plaintext token. Show or send it once, never store it. */
    token: string;
    /** sha256 hex of the token. This is the only thing that gets stored. */
    hash: string;
}

export function hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateToken(kind: TokenKind): GeneratedToken {
    const token = PREFIXES[kind] + randomBytes(32).toString("base64url");
    return { token, hash: hashToken(token) };
}

/** Constant-time comparison of two sha256 hex hashes. */
export function hashesEqual(a: string, b: string): boolean {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    if (left.length === 0 || left.length !== right.length) {
        return false;
    }
    return timingSafeEqual(left, right);
}

/** First 12 characters, safe to display (e.g. `seal_live_ab`). */
export function tokenPrefix(token: string): string {
    return token.slice(0, 12);
}

export function tokenLast4(token: string): string {
    return token.slice(-4);
}

/** Returns the token kind implied by its prefix, or null if unprefixed. */
export function tokenKindFromPrefix(token: string): "service" | "device" | null {
    if (token.startsWith(PREFIXES.service)) return "service";
    if (token.startsWith(PREFIXES.device)) return "device";
    return null;
}
