// ============================================================================
// FILE: /backend/src/modules/organization/application/commands/create-organization.command.ts
// NEW FILE
// ============================================================================

import { OrganizationType } from "../../domain/enums/organization-type.enum.js";

export interface CreateOrganizationCommand {

    ownerId: string;

    name: string;

    slug: string;

    type?: OrganizationType;

    description?: string;

    website?: string;

    logoUrl?: string;

}
