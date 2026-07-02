// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/control-evidence.ts
// NEW FILE
// ============================================================================

export class ControlEvidence{

    constructor(

        readonly evidenceId:string,

        readonly controlId:string,

        readonly source:string,

        readonly checksum:string,

        readonly uploadedBy:string,

        readonly collectedAt:Date

    ){}

}
