// ============================================================================
// FILE: /backend/src/modules/identity/domain/valueObjects/password.vo.ts
// NEW FILE
// ============================================================================

export class Password {

    constructor(

        private readonly value: string

    ) {

        if (value.length < 12) {

            throw new Error(

                "Password too short."

            );

        }

    }

    public raw(): string {

        return this.value;

    }

}
