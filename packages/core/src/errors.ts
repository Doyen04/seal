export const ERROR_CODES = [
    "VALIDATION_ERROR",
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "SECRET_CONFLICT",
    "RATE_LIMITED",
    "TOKEN_REVOKED",
    "TOKEN_EXPIRED",
    "EMAIL_NOT_VERIFIED",
    "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Shape of every non-2xx API response. */
export interface ApiErrorBody {
    error: {
        code: ErrorCode;
        message: string;
        details?: Record<string, unknown>;
    };
}

export function isErrorCode(value: unknown): value is ErrorCode {
    return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}
