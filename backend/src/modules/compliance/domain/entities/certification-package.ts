// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/certification-package.ts
// NEW FILE
// ============================================================================

export class CertificationPackage{

    constructor(

        readonly packageId:string,

        readonly certificationId:string,

        readonly evidenceCount:number,

        readonly controlCount:number,

        readonly checksum:string,

        readonly generatedAt:Date

    ){}

}
