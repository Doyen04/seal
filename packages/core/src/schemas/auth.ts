import { z } from "zod";
import { currentPasswordSchema, emailSchema, emailTokenSchema, nameSchema, newPasswordSchema } from "./common.js";

export const signupSchema = z.object({
    email: emailSchema,
    password: newPasswordSchema,
    name: nameSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const verifyEmailSchema = z.object({
    token: emailTokenSchema,
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const loginSchema = z.object({
    email: emailSchema,
    password: currentPasswordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const deviceLoginSchema = z.object({
    email: emailSchema,
    password: currentPasswordSchema,
    deviceName: z.string().trim().min(1).max(100),
    platform: z.string().trim().min(1).max(50),
});
export type DeviceLoginInput = z.infer<typeof deviceLoginSchema>;

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    token: emailTokenSchema,
    password: newPasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Response shapes shared by the API and its clients.

export interface UserDto {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
}

export interface WorkspaceSummaryDto {
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "editor" | "viewer";
}

export interface MeResponse {
    user: UserDto;
    workspaces: WorkspaceSummaryDto[];
}

export interface DeviceLoginResponse {
    deviceToken: string;
    user: UserDto;
}

export interface DeviceDto {
    id: string;
    name: string;
    platform: string;
    lastSeenAt: string | null;
    createdAt: string;
}
