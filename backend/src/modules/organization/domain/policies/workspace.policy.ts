// ============================================================================
// FILE: /backend/src/modules/organization/domain/policies/workspace.policy.ts
// NEW FILE
// ============================================================================

import { Workspace }
from "../entities/workspace.entity.js";

import { WorkspaceNameUniqueSpecification }
from "../specifications/workspace-name-unique.specification.js";

export class WorkspacePolicy {

    async validate(

        name: string,

        workspaces: Workspace[]

    ): Promise<void> {

        const unique =

            await new WorkspaceNameUniqueSpecification(

                name

            ).isSatisfiedBy(

                workspaces

            );

        if (!unique)

            throw new Error(

                "Workspace already exists."

            );

    }

}
