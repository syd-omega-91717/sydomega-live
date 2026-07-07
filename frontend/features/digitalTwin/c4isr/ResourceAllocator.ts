// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/ResourceAllocator.ts
// ============================================================================

export interface Resource{

    id:string;

    name:string;

    available:boolean;

}

export class ResourceAllocator{

    assign(

        resource:Resource,

        missionId:string

    ){

        return{

            missionId,

            resourceId:resource.id,

            assigned:true

        };

    }

}
