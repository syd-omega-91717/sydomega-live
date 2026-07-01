// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/device-attestation.ts
// NEW FILE
// ============================================================================

export class DeviceAttestation{

    constructor(

        readonly deviceId:string,

        readonly attestationProvider:string,

        readonly verified:boolean,

        readonly verifiedAt:Date

    ){}

}
