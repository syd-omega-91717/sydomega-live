// ============================================================================
// FILE:
// /enterprise/education/DigitalCredentialEngine.ts
// ============================================================================

export class DigitalCredentialEngine{

    verify(

        verificationCode:string

    ){

        return{

            verificationCode,

            valid:true

        };

    }

}
