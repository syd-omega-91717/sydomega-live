// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/EdgeNodeManager.ts
// ============================================================================

export interface EdgeNode{

    id:string;

    location:string;

    connected:boolean;

}

export class EdgeNodeManager{

    private readonly nodes=

    new Map<string,EdgeNode>();

    register(node:EdgeNode){

        this.nodes.set(

            node.id,

            node

        );

    }

    online(){

        return[

            ...this.nodes.values()

        ].filter(

            node=>node.connected

        );

    }

}
