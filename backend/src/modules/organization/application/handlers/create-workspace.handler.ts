// ============================================================================
// FILE: /backend/src/modules/organization/application/handlers/create-workspace.handler.ts
// NEW FILE
// ============================================================================

import { WorkspaceFactory }
from "../../domain/factories/workspace.factory.js";

import { OrganizationRepository }
from "../../domain/repositories/organization.repository.js";

import { CreateWorkspaceCommand }
from "../commands/create-workspace.command.js";

export class CreateWorkspaceHandler {

    constructor(

        private readonly repository: OrganizationRepository

    ) {}

    async execute(

        command: CreateWorkspaceCommand

    ) {

        const aggregate =

            await this.repository.findById(

                command.organizationId

            );

        if (!aggregate)

            throw new Error(

                "Organization not found."

            );

        aggregate.createWorkspace(

            WorkspaceFactory.create(

                command.organizationId,

                command.name,

                command.description,

                command.isDefault

            )

        );

        await this.repository.save(

            aggregate

        );

    }

}
