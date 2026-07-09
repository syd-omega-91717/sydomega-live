// ============================================================================
// FILE:
// /enterprise/identity/CertificateAuthorityEngine.ts
// ============================================================================

export class CertificateAuthorityEngine{

    sign(

        certificateId:string

    ){

        return{

            certificateId,

            signed:true

        };

    }

}
