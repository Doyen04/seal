import type { Deps } from "./deps.js";

export type Principal =
  | { type: "user"; userId: string; sessionId: string }
  | { type: "device"; userId: string; deviceId: string }
  | { type: "service_token"; tokenId: string; environmentId: string };

export type PrincipalType = Principal["type"];

export type AppEnv = {
  Variables: {
    requestId: string;
    deps: Deps;
    ip: string;
    /** Null until `authenticate` runs, and for unauthenticated requests. */
    principal: Principal | null;
  };
};
