// ============================================================================
// FILE: /backend/src/modules/identity/domain/value-objects/device-fingerprint.ts
// NEW FILE
// ============================================================================

export class DeviceFingerprint{

    constructor(

        readonly value:string

    ){

        if(value.length < 32){

            throw new Error(

                "Invalid fingerprint."

            );

        }

    }

}
