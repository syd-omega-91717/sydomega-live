// ============================================================================
// FILE:
// /enterprise/intelligence/KnowledgeGraphEngine.ts
// ============================================================================

import { KnowledgeNode } from "./KnowledgeNode";

export class KnowledgeGraphEngine{

    index(

        node:KnowledgeNode

    ){

        return{

            node,

            indexed:true

        };

    }

}
