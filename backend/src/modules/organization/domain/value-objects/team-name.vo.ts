// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/team-name.vo.ts
// NEW FILE
// ============================================================================

export class TeamName {

    constructor(

        private readonly value: string

    ) {

        if (

            value.trim().length < 2

        ) {

            throw new Error(

                "Team name is invalid."

            );

        }

    }

    public toString() {

        return this.value.trim();

    }

}
