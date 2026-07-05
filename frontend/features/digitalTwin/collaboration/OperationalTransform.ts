// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/OperationalTransform.ts
// ============================================================================

export interface Operation{

    version:number;

    path:string;

    value:any;

}

export class OperationalTransform{

    transform(

        local:Operation,

        remote:Operation

    ){

        if(

            local.version>=remote.version

        ){

            return local;

        }

        return remote;

    }

}
