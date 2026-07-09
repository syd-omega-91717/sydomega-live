// ============================================================================
// FILE:
// /enterprise/ai/KnowledgeGraphEngine.ts
// ============================================================================

import { KnowledgeNode } from "./KnowledgeNode";

export class KnowledgeGraphEngine{

    private readonly nodes=

    new Map<string,KnowledgeNode>();

    add(

        node:KnowledgeNode

    ){

        this.nodes.set(

            node.id,

            node

        );

    }

    graph(){

        return [...this.nodes.values()];

    }

}
