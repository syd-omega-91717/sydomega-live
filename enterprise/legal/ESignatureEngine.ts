// ============================================================================
// FILE:
// /enterprise/legal/ESignatureEngine.ts
// ============================================================================

export class ESignatureEngine{

    sign(

        contractId:string,

        signer:string

    ){

        return{

            contractId,

            signer,

            signed:true

        };

    }

}
