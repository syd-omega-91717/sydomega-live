// ============================================================================
// FILE:
// /core/ai/KnowledgeIndex.ts
// ============================================================================

export class KnowledgeIndex{

    private readonly documents:string[]=[];

    add(

        document:string

    ){

        this.documents.push(document);

    }

    search(

        keyword:string

    ){

        return this.documents.filter(

            d=>d.includes(keyword)

        );

    }

}
