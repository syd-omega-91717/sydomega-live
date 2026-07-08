// ============================================================================
// FILE:
// /enterprise/data-fabric/LineageEngine.ts
// ============================================================================

import { DataLineage } from "./DataLineage";

export class LineageEngine{

    track(

        lineage:DataLineage

    ){

        return{

            tracked:true,

            lineage

        };

    }

}
