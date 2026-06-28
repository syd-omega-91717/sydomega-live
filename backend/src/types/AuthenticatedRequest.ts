// ============================================================================
// FILE: /backend/src/types/AuthenticatedRequest.ts
// NEW FILE
// ============================================================================

import { Request } from "express";
import { User } from "./User.js";
import { Profile } from "./Profile.js";

export interface AuthenticatedRequest extends Request {

    user: User;

    profile: Profile;

    requestId?: string;

}
