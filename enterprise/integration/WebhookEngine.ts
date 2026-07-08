// ============================================================================
// FILE:
// /enterprise/integration/WebhookEngine.ts
// ============================================================================

export class WebhookEngine{

    async trigger(

        endpoint:string,

        payload:unknown

    ){

        return{

            endpoint,

            delivered:true,

            payload

        };

    }

}
