// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/merkle-proof.ts
// NEW FILE
// ============================================================================

export class MerkleProof{

    constructor(

        readonly rootHash:string,

        readonly leafHash:string,

        readonly proof:string[],

        readonly verified:boolean

    ){}

}
