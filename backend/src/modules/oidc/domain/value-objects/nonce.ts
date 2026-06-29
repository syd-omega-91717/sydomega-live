// ============================================================================
// FILE: /backend/src/modules/oidc/domain/value-objects/nonce.ts
// NEW FILE
// ============================================================================

export class Nonce {

    constructor(

        readonly value: string

    ) {

        if (!value.trim()) {

            throw new Error("Invalid nonce.");

        }

    }

}
