import type { ApiErrorBody, ErrorCode } from "@repo/core";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHENTICATED: 401,
    TOKEN_REVOKED: 401,
    TOKEN_EXPIRED: 401,
    FORBIDDEN: 403,
    EMAIL_NOT_VERIFIED: 403,
    NOT_FOUND: 404,
    SECRET_CONFLICT: 409,
    RATE_LIMITED: 429,
    INTERNAL: 500,
};

export class AppError extends Error {
    readonly code: ErrorCode;
    readonly status: number;
    readonly details: Record<string, unknown> | undefined;
    readonly headers: Record<string, string> | undefined;

    constructor(
        code: ErrorCode,
        message: string,
        options: {
            details?: Record<string, unknown>;
            headers?: Record<string, string>;
        } = {},
    ) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.status = STATUS_BY_CODE[code];
        this.details = options.details;
        this.headers = options.headers;
    }

    toBody(): ApiErrorBody {
        return {
            error: {
                code: this.code,
                message: this.message,
                ...(this.details ? { details: this.details } : {}),
            },
        };
    }
}

export const unauthenticated = (message = "Authentication required") => new AppError("UNAUTHENTICATED", message);

export const forbidden = (message = "You do not have access to this resource") => new AppError("FORBIDDEN", message);

export const notFound = (message = "Not found") => new AppError("NOT_FOUND", message);

export const validationError = (message: string, details?: Record<string, unknown>) =>
    new AppError("VALIDATION_ERROR", message, details ? { details } : {});
