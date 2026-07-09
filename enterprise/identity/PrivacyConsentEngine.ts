// ============================================================================
// FILE:
// /enterprise/identity/PrivacyConsentEngine.ts
// ============================================================================

export class PrivacyConsentEngine{

    recordConsent(

        identityId:string,

        consentType:string

    ){

        return{

            identityId,

            consentType,

            recorded:true

        };

    }

}
