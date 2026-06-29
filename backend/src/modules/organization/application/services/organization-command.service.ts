// ============================================================================
// FILE: /backend/src/modules/organization/application/services/organization-command.service.ts
// NEW FILE
// ============================================================================

import { CreateOrganizationHandler }
from "../handlers/create-organization.handler.js";

import { CreateWorkspaceHandler }
from "../handlers/create-workspace.handler.js";

export class OrganizationCommandService {

    constructor(

        public readonly createOrganization: CreateOrganizationHandler,

        public readonly createWorkspace: CreateWorkspaceHandler

    ) {}

}
