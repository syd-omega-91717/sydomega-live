// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/invitation-token.vo.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export class InvitationToken {

    private constructor(

        private readonly value: string

    ) {}

    public static generate() {

        return new InvitationToken(

            crypto.randomBytes(32)

                .toString("hex")

        );

    }

    public toString() {

        return this.value;

    }

}
