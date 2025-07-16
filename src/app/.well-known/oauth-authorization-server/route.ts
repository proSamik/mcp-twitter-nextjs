import { auth } from "../../../lib/auth/server";
import { oAuthDiscoveryMetadata } from "better-auth/plugins";

// Better Auth OAuth authorization server metadata
export const GET = oAuthDiscoveryMetadata(auth);
