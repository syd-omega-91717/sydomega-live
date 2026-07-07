// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/AttackGraphEngine.ts
// ============================================================================

export interface AttackNode{

    id:string;

    name:string;

}

export class AttackGraphEngine{

    build(

        nodes:AttackNode[]

    ){

        return{

            vertices:nodes.length,

            generated:true

        };

    }

}
