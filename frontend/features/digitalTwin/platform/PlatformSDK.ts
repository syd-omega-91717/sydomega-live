// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/PlatformSDK.ts
// ============================================================================

export class PlatformSDK{

    constructor(

        private readonly endpoint:string

    ){}

    async get(

        path:string

    ){

        return fetch(

            `${this.endpoint}${path}`

        );

    }

    async post(

        path:string,

        body:unknown

    ){

        return fetch(

            `${this.endpoint}${path}`,

            {

                method:"POST",

                headers:{

                    "Content-Type":

                    "application/json"

                },

                body:JSON.stringify(body)

            }

        );

    }

}
