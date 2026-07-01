// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/conflict-mitigation.ts
// NEW FILE
// ============================================================================

export class ConflictMitigation{

    constructor(

        readonly conflictId:string,

        readonly mitigatedBy:string,

        readonly justification:string,

        readonly expiresAt:Date|null

    ){}

}
