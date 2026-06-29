// ============================================================================
// FILE: /backend/src/modules/organization/application/commands/change-member-role.command.ts
// NEW FILE
// ============================================================================

import { MembershipRole } from "../../domain/enums/membership-role.enum.js";

export interface ChangeMemberRoleCommand {

    organizationId: string;

    profileId: string;

    role: MembershipRole;

}
