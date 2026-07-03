// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/entities/twin-state.ts
// NEW FILE
// ============================================================================

export class TwinState{

    constructor(

        readonly twinId:string,

        readonly version:number,

        readonly timestamp:Date,

        readonly state:Record<string,unknown>

    ){}

}
