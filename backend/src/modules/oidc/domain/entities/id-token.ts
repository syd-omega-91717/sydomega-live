// ============================================================================
// FILE: /backend/src/modules/oidc/domain/entities/id-token.ts
// NEW FILE
// ============================================================================

import { SubjectId } from "../value-objects/subject-id";

export class IdToken {

    constructor(

        readonly issuer: string,

        readonly audience: string,

        readonly subject: SubjectId,

        readonly issuedAt: Date,

        readonly expiresAt: Date,

        readonly nonce?: string

    ) {}

}
