// ============================================================================
// FILE: /backend/src/modules/iot/domain/entities/firmware-package.ts
// NEW FILE
// ============================================================================

export class FirmwarePackage{

    constructor(

        readonly packageId:string,

        readonly version:string,

        readonly checksum:string,

        readonly rolloutPercentage:number

    ){}

}
