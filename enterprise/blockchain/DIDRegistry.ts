// ============================================================================
// FILE:
// /enterprise/blockchain/DIDRegistry.ts
// ============================================================================

import { DecentralizedIdentity } from "./DecentralizedIdentity";

export class DIDRegistry{

    private readonly registry=

    new Map<string,DecentralizedIdentity>();

    register(

        did:DecentralizedIdentity

    ){

        this.registry.set(

            did.id,

            did

        );

    }

    resolve(

        id:string

    ){

        return this.registry.get(id);

    }

}
