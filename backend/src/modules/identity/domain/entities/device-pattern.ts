// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/device-pattern.ts
// NEW FILE
// ============================================================================

export class DevicePattern{

    constructor(

        readonly deviceId:string,

        readonly trustScore:number,

        readonly usageCount:number

    ){}

}
