// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/APIGateway.ts
// ============================================================================

export class APIGateway{

    async request(

        endpoint:string,

        options?:RequestInit

    ){

        return fetch(

            endpoint,

            options

        );

    }

}
