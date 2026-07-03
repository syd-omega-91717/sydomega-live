// ============================================================================
// FILE: /backend/src/modules/iam/domain/entities/mfa-device.ts
// NEW FILE
// ============================================================================

export class MFADevice{

    constructor(

        readonly deviceId:string,

        readonly userId:string,

        readonly type:string,

        readonly verified:boolean

    ){}

}
