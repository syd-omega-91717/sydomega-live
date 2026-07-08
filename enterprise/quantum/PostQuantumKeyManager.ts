// ============================================================================
// FILE:
// /enterprise/quantum/PostQuantumKeyManager.ts
// ============================================================================

import { PostQuantumKey } from "./PostQuantumKey";

export class PostQuantumKeyManager{

    private readonly keys=

    new Map<string,PostQuantumKey>();

    store(

        key:PostQuantumKey

    ){

        this.keys.set(

            key.id,

            key

        );

    }

    load(

        id:string

    ){

        return this.keys.get(id);

    }

}
