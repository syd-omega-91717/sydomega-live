// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/department-name.vo.ts
// NEW FILE
// ============================================================================

export class DepartmentName {

    constructor(

        private readonly value: string

    ) {

        if (

            value.trim().length < 2

        ) {

            throw new Error(

                "Department name is invalid."

            );

        }

    }

    public toString() {

        return this.value.trim();

    }

}
