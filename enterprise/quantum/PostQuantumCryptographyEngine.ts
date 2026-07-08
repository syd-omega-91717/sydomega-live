// ============================================================================
// FILE:
// /enterprise/quantum/PostQuantumCryptographyEngine.ts
// ============================================================================

import { PostQuantumKey } from "./PostQuantumKey";

export class PostQuantumCryptographyEngine{

    generate(

        algorithm:string

    ):PostQuantumKey{

        return{

            id:crypto.randomUUID(),

            algorithm,

            publicKey:"",

            privateKey:"",

            createdAt:Date.now()

        };

    }

}
