// ============================================================================
// FILE:
// /enterprise/knowledge/VectorEmbeddingEngine.ts
// ============================================================================

export class VectorEmbeddingEngine{

    embed(

        content:string

    ){

        return{

            content,

            dimensions:1536,

            generated:true

        };

    }

}
