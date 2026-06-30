// ============================================================================
// FILE: /backend/src/modules/saml/domain/entities/saml-assertion.ts
// NEW FILE
// ============================================================================

export class SamlAssertion {

    constructor(

        readonly id: string,

        readonly subject: string,

        readonly issuer: string,

        readonly issuedAt: Date,

        readonly expiresAt: Date

    ) {}

}
