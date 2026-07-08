// ============================================================================
// FILE:
// /core/identity/DIDEngine.ts
// ============================================================================

export class DIDEngine{

    create(

        userId:string

    ){

        return{

            did:`did:sydomega:${userId}`,

            createdAt:Date.now()

        };

    }

}
