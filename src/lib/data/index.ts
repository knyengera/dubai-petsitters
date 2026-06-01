import { entities } from "./entities";
import { authApi } from "./auth-api";
import { integrations } from "./integrations";

/** Compatibility shim matching the Base44 SDK shape used by ported pages. */
export const base44 = {
  entities,
  auth: authApi,
  integrations,
};

export { entities, authApi, integrations };
