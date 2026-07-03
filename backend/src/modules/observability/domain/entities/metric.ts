// ============================================================================
// FILE: /backend/src/modules/observability/domain/entities/metric.ts
// NEW FILE
// ============================================================================

import { MetricType }
from "../enums/metric-type";

export class Metric{

    constructor(

        readonly metricId:string,

        readonly name:string,

        readonly type:MetricType,

        readonly value:number,

        readonly labels:Record<string,string>,

        readonly timestamp:Date

    ){}

}
