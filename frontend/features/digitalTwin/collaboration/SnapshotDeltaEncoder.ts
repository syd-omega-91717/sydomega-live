// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/SnapshotDeltaEncoder.ts
// ============================================================================

export class SnapshotDeltaEncoder{

    encode(

        previous:any,

        current:any

    ){

        const delta:Record<string,unknown>={};

        Object.keys(current).forEach(key=>{

            if(previous[key]!==current[key]){

                delta[key]=current[key];

            }

        });

        return delta;

    }

}
