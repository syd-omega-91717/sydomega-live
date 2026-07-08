// ============================================================================
// FILE:
// /core/identity/OAuthEngine.ts
// ============================================================================

export class OAuthEngine{

    authorize(

        provider:string

    ){

        return{

            provider,

            authorized:true,

            timestamp:Date.now()

        };

    }

}
