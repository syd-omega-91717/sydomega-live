// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/workspace-name.vo.ts
// NEW FILE
// ============================================================================

export class WorkspaceName {

    constructor(

        private readonly value: string

    ) {

        if (

            value.trim().length < 2

        ) {

            throw new Error(

                "Workspace name is too short."

            );

        }

    }

    public toString() {

        return this.value.trim();

    }

}
