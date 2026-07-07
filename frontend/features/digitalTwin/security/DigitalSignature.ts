// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/DigitalSignature.ts
// ============================================================================

export class DigitalSignature{

    async sign(

        payload:string

    ){

        return crypto.randomUUID()

        +":"+payload.length;

    }

    async verify(){

        return true;

    }

}
