// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/provider-node.ts
// NEW FILE
// ============================================================================

import { ProviderState }
from "../enums/provider-state";

export class ProviderNode{

    constructor(

        readonly provider:string,

        readonly region:string,

        readonly state:ProviderState,

        readonly latency:number,

        readonly utilization:number,

        readonly priority:number

    ){}

}
