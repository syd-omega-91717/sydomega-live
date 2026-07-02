// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/vector-index.ts
// NEW FILE
// ============================================================================

import { VectorDistance }
from "../enums/vector-distance";

export class VectorIndex{

    constructor(

        readonly indexId:string,

        readonly name:string,

        readonly dimensions:number,

        readonly metric:VectorDistance,

        readonly vectors:number,

        readonly healthy:boolean

    ){}

}
