import type { ApiErrorBody, ErrorCode } from "./errors.js";
import { isErrorCode } from "./errors.js";
import type {
  DeviceDto,
  DeviceLoginInput,
  DeviceLoginResponse,
  ForgotPasswordInput,
  LoginInput,
  MeResponse,
  ResetPasswordInput,
  SignupInput,
  UserDto,
  VerifyEmailInput,
} from "./schemas/auth.js";
import type {
  BulkSecretsInput,
  BulkWriteResponse,
  ExportResponse,
  SecretMetaDto,
  SecretValueDto,
  SecretVersionDto,
  SecretWriteResultDto,
} from "./schemas/secrets.js";
import type {
  CreateServiceTokenInput,
  CreateServiceTokenResponse,
  ServiceTokenDto,
} from "./schemas/tokens.js";
import type {
  AuditPageDto,
  AuditQuery,
  CreateEnvironmentInput,
  CreateProjectInput,
  CreateWorkspaceInput,
  EnvironmentDto,
  InvitationDto,
  InviteMemberInput,
  MemberDto,
  ProjectDetailDto,
  ProjectDto,
  RemoveMemberResponse,
  UpdateMemberInput,
  UpdateProjectInput,
  WorkspaceDto,
} from "./schemas/workspaces.js";

export const SESSION_COOKIE_NAME = "seal_session";

/** A non-2xx API response, or a network failure (status 0). */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ApiClientOptions {
  /** Origin of the API including `/v1`, e.g. `https://api.example.com/v1`. */
  baseUrl: string;
  /** Device token (`seald_...`) or service token (`seal_live_...`). */
  token?: string;
  /**
   * Session token for a logged-in web user. Sent as a cookie. Only the web
   * app's server uses this; it must also set `origin`.
   */
  sessionToken?: string;
  /** Sent as the `Origin` header. Required by the API for session-cookie writes. */
  origin?: string;
  /** Request timeout in milliseconds. Default 15000. */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  body?: unknown;
  query?: Query;
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

/** Extracts the session token from `Set-Cookie` header values, if present. */
export function parseSessionCookie(setCookies: string[]): string | null {
  for (const header of setCookies) {
    const first = header.split(";")[0] ?? "";
    const eq = first.indexOf("=");
    if (eq === -1) continue;
    if (first.slice(0, eq).trim() === SESSION_COOKIE_NAME) {
      const value = first.slice(eq + 1).trim();
      return value === "" ? null : value;
    }
  }
  return null;
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;

  async function send(
    method: string,
    path: string,
    { body, query }: RequestOptions = {},
  ): Promise<Response> {
    const url = new URL(baseUrl + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    } else if (options.sessionToken) {
      headers.Cookie = `${SESSION_COOKIE_NAME}=${options.sessionToken}`;
    }
    if (options.origin) headers.Origin = options.origin;

    let response: Response;
    try {
      response = await doFetch(url, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
        redirect: "manual",
      });
    } catch {
      throw new ApiError("INTERNAL", "Could not reach the API", 0);
    }

    if (!response.ok) throw await toApiError(response);
    return response;
  }

  async function request<T>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const response = await send(method, path, opts);
    return (await response.json()) as T;
  }

  const get = <T>(path: string, query?: Query) =>
    request<T>("GET", path, query ? { query } : {});
  const post = <T>(path: string, body?: unknown) =>
    request<T>("POST", path, body === undefined ? {} : { body });
  const put = <T>(path: string, body: unknown) =>
    request<T>("PUT", path, { body });
  const patch = <T>(path: string, body: unknown) =>
    request<T>("PATCH", path, { body });
  const del = <T>(path: string, body?: unknown) =>
    request<T>("DELETE", path, body === undefined ? {} : { body });

  const ok = { ok: true } as const;
  type Ok = typeof ok;

  return {
    // Auth and account
    signup: (input: SignupInput) => post<Ok>("/auth/signup", input),
    verifyEmail: (input: VerifyEmailInput) => post<Ok>("/auth/verify-email", input),
    /** Returns the user and the new session token (from `Set-Cookie`). */
    async login(input: LoginInput): Promise<{ user: UserDto; sessionToken: string }> {
      const response = await send("POST", "/auth/login", { body: input });
      const { user } = (await response.json()) as { user: UserDto };
      const sessionToken = parseSessionCookie(response.headers.getSetCookie());
      if (!sessionToken) {
        throw new ApiError("INTERNAL", "The API did not return a session", 500);
      }
      return { user, sessionToken };
    },
    logout: () => post<Ok>("/auth/logout"),
    deviceLogin: (input: DeviceLoginInput) =>
      post<DeviceLoginResponse>("/auth/device-login", input),
    forgotPassword: (input: ForgotPasswordInput) =>
      post<Ok>("/auth/forgot-password", input),
    resetPassword: (input: ResetPasswordInput) =>
      post<Ok>("/auth/reset-password", input),
    me: () => get<MeResponse>("/me"),
    listDevices: () => get<{ devices: DeviceDto[] }>("/devices"),
    revokeDevice: (id: string) => del<Ok>(`/devices/${enc(id)}`),

    // Workspaces and members
    createWorkspace: (input: CreateWorkspaceInput) =>
      post<WorkspaceDto>("/workspaces", input),
    listWorkspaces: () => get<{ workspaces: WorkspaceDto[] }>("/workspaces"),
    listMembers: (workspaceId: string) =>
      get<{ members: MemberDto[] }>(`/workspaces/${enc(workspaceId)}/members`),
    inviteMember: (workspaceId: string, input: InviteMemberInput) =>
      post<InvitationDto>(`/workspaces/${enc(workspaceId)}/invitations`, input),
    acceptInvitation: (token: string) =>
      post<{ workspace: WorkspaceDto }>("/invitations/accept", { token }),
    updateMember: (workspaceId: string, userId: string, input: UpdateMemberInput) =>
      patch<{ member: MemberDto }>(
        `/workspaces/${enc(workspaceId)}/members/${enc(userId)}`,
        input,
      ),
    removeMember: (workspaceId: string, userId: string) =>
      del<RemoveMemberResponse>(
        `/workspaces/${enc(workspaceId)}/members/${enc(userId)}`,
      ),
    audit: (workspaceId: string, query: Partial<AuditQuery> = {}) =>
      get<AuditPageDto>(`/workspaces/${enc(workspaceId)}/audit`, query),

    // Projects and environments
    createProject: (workspaceId: string, input: CreateProjectInput) =>
      post<ProjectDetailDto>(`/workspaces/${enc(workspaceId)}/projects`, input),
    listProjects: (workspaceId: string) =>
      get<{ projects: ProjectDto[] }>(`/workspaces/${enc(workspaceId)}/projects`),
    getProject: (projectId: string) =>
      get<ProjectDetailDto>(`/projects/${enc(projectId)}`),
    updateProject: (projectId: string, input: UpdateProjectInput) =>
      patch<{ project: ProjectDto }>(`/projects/${enc(projectId)}`, input),
    archiveProject: (projectId: string) => del<Ok>(`/projects/${enc(projectId)}`),
    createEnvironment: (projectId: string, input: CreateEnvironmentInput) =>
      post<{ environment: EnvironmentDto }>(
        `/projects/${enc(projectId)}/environments`,
        input,
      ),

    // Secrets
    listSecrets: (environmentId: string) =>
      get<{ secrets: SecretMetaDto[] }>(`/environments/${enc(environmentId)}/secrets`),
    getSecret: (environmentId: string, key: string) =>
      get<SecretValueDto>(`/environments/${enc(environmentId)}/secrets/${enc(key)}`),
    putSecret: (
      environmentId: string,
      key: string,
      input: { value: string; baseVersion?: number },
    ) =>
      put<SecretWriteResultDto>(
        `/environments/${enc(environmentId)}/secrets/${enc(key)}`,
        input,
      ),
    deleteSecret: (environmentId: string, key: string, baseVersion?: number) =>
      del<SecretWriteResultDto>(
        `/environments/${enc(environmentId)}/secrets/${enc(key)}`,
        baseVersion === undefined ? undefined : { baseVersion },
      ),
    bulkSecrets: (environmentId: string, input: BulkSecretsInput) =>
      post<BulkWriteResponse>(`/environments/${enc(environmentId)}/secrets/bulk`, input),
    exportEnvironment: (environmentId: string) =>
      get<ExportResponse>(`/environments/${enc(environmentId)}/export`),
    listSecretVersions: (secretId: string) =>
      get<{ versions: SecretVersionDto[] }>(`/secrets/${enc(secretId)}/versions`),
    rollbackSecret: (secretId: string, version: number) =>
      post<SecretWriteResultDto>(`/secrets/${enc(secretId)}/rollback`, { version }),

    // Service tokens
    createServiceToken: (environmentId: string, input: CreateServiceTokenInput) =>
      post<CreateServiceTokenResponse>(`/environments/${enc(environmentId)}/tokens`, input),
    listServiceTokens: (environmentId: string) =>
      get<{ tokens: ServiceTokenDto[] }>(`/environments/${enc(environmentId)}/tokens`),
    revokeServiceToken: (tokenId: string) =>
      del<Ok>(`/tokens/${enc(tokenId)}`),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    const error = body.error;
    if (error && isErrorCode(error.code) && typeof error.message === "string") {
      return new ApiError(error.code, error.message, response.status, error.details);
    }
  } catch {
    // not JSON
  }
  return new ApiError("INTERNAL", "Unexpected response from the API", response.status);
}
