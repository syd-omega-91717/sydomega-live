// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/workspace-name-unique.specification.ts
// NEW FILE
// ============================================================================

import type {

    Workspace

}

from "../entities/workspace.entity.js";

import type {

    Specification

}

from "./specification.js";

export class WorkspaceNameUniqueSpecification

implements Specification<Workspace[]> {

    constructor(

        private readonly name: string

    ) {}

    async isSatisfiedBy(

        workspaces: Workspace[]

    ): Promise<boolean> {

        return !workspaces.some(

            workspace =>

                workspace.name

                    .trim()

                    .toLowerCase() ===

                this.name

                    .trim()

                    .toLowerCase()

        );

    }

}
