// ============================================================================
// FILE:
// /enterprise/education/KnowledgeRepositoryEngine.ts
// ============================================================================

export class KnowledgeRepositoryEngine{

    index(

        knowledgeId:string

    ){

        return{

            knowledgeId,

            indexed:true

        };

    }

}
