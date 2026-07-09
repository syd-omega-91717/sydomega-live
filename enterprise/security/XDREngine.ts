// ============================================================================
// FILE:
// /enterprise/security/XDREngine.ts
// ============================================================================

export class XDREngine{

    correlate(

        investigationId:string

    ){

        return{

            investigationId,

            correlated:true

        };

    }

}
