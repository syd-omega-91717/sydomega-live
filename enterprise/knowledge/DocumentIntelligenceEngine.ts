// ============================================================================
// FILE:
// /enterprise/knowledge/DocumentIntelligenceEngine.ts
// ============================================================================

export class DocumentIntelligenceEngine{

    extract(

        documentId:string

    ){

        return{

            documentId,

            entities:[],

            completed:true

        };

    }

}
