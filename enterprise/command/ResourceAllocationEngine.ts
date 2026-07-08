// ============================================================================
// FILE:
// /enterprise/command/ResourceAllocationEngine.ts
// ============================================================================

import { Resource } from "./Resource";

export class ResourceAllocationEngine{

    assign(

        resource:Resource,

        missionId:string

    ){

        resource.available=false;

        return{

            missionId,

            resource

        };

    }

}
