import { ApiError } from "@/lib/api-client";

/** Internal-only text that must never be shown to a person. */
const INTERNAL_MESSAGES = [
    "Could not reach the API",
    "Unexpected response from the API",
    "Failed to fetch",
    "The API did not return a session",
];

/**
 * Turns any thrown value into something safe to put in front of a user.
 *
 * Pages used to toast `err.message` directly, which surfaced internal
 * diagnostics like "Could not reach the API" and raw non-JSON responses.
 * Messages the API returns for 4xx are written for the person using the
 * product (validation, permissions), so those are kept; transport failures and
 * 5xx responses are replaced with something plain.
 */
export function toUserMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
    if (err instanceof ApiError) {
        if (err.status === 0) {
            return "We could not reach the server. Check your connection and try again.";
        }
        if (err.status >= 500) {
            return "Something went wrong on our end. Please try again in a moment.";
        }
        if (err.message && !INTERNAL_MESSAGES.includes(err.message)) {
            return err.message;
        }
        return fallback;
    }

    if (err instanceof Error && err.message && !INTERNAL_MESSAGES.includes(err.message)) {
        return err.message;
    }

    return fallback;
}
