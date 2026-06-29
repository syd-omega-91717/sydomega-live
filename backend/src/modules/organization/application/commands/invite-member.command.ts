// ============================================================================
// FILE: /backend/src/modules/organization/application/commands/invite-member.command.ts
// NEW FILE
// ============================================================================

import { MembershipRole } from "../../domain/enums/membership-role.enum.js";

export interface InviteMemberCommand {

    organizationId: string;

    email: string;

    profileId: string;

    role: MembershipRole;

}
