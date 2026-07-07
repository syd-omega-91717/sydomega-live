// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/ClusterManager.ts
// ============================================================================

export interface ClusterNode{

    id:string;

    hostname:string;

    status:"ONLINE"|"OFFLINE";

    cpu:number;

    memory:number;

}

export class ClusterManager{

    private readonly nodes=

    new Map<string,ClusterNode>();

    register(

        node:ClusterNode

    ){

        this.nodes.set(

            node.id,

            node

        );

    }

    remove(id:string){

        this.nodes.delete(id);

    }

    all(){

        return [...this.nodes.values()];

    }

}
