// ============================================================================
// FILE:
// /core/ai/VectorStore.ts
// ============================================================================

export class VectorStore{

    private readonly vectors=

    new Map<string,number[]>();

    upsert(

        id:string,

        vector:number[]

    ){

        this.vectors.set(

            id,

            vector

        );

    }

    get(

        id:string

    ){

        return this.vectors.get(id);

    }

}
