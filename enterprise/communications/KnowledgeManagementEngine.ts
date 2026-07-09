// ============================================================================
// FILE:
// /enterprise/communications/KnowledgeManagementEngine.ts
// ============================================================================

import { KnowledgeArticle } from "./KnowledgeArticle";

export class KnowledgeManagementEngine{

    index(

        article:KnowledgeArticle

    ){

        return{

            article,

            indexed:true

        };

    }

}
