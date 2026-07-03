// ============================================================================
// FILE: /backend/src/modules/evaluation/domain/entities/benchmark-result.ts
// NEW FILE
// ============================================================================

import { BenchmarkType }
from "../enums/benchmark-type";

export class BenchmarkResult{

    constructor(

        readonly resultId:string,

        readonly evaluationId:string,

        readonly type:BenchmarkType,

        readonly score:number,

        readonly passed:boolean

    ){}

}
