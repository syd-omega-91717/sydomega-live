// ============================================================================
// FILE: /backend/src/modules/iot/domain/entities/device-shadow.ts
// NEW FILE
// ============================================================================

export class DeviceShadow{

    constructor(

        readonly deviceId:string,

        readonly reportedState:Record<string,unknown>,

        readonly desiredState:Record<string,unknown>,

        readonly synchronized:boolean

    ){}

}
