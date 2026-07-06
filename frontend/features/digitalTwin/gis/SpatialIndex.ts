// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/SpatialIndex.ts
// ============================================================================

export interface SpatialNode{

    id:string;

    x:number;

    y:number;

}

export class SpatialIndex{

    private readonly nodes=

    new Map<string,SpatialNode>();

    insert(node:SpatialNode){

        this.nodes.set(node.id,node);

    }

    remove(id:string){

        this.nodes.delete(id);

    }

    nearest(

        x:number,

        y:number,

        radius:number

    ){

        return [...this.nodes.values()]

        .filter(node=>{

            const dx=node.x-x;

            const dy=node.y-y;

            return Math.sqrt(

                dx*dx+dy*dy

            )<=radius;

        });

    }

}
