// ============================================================================
// FILE:
// /enterprise/security/EDREngine.ts
// ============================================================================

export class EDREngine{

    inspect(

        endpoint:string

    ){

        return{

            endpoint,

            compromised:false

        };

    }

}
