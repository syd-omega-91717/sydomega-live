// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-monitor.ts
// NEW FILE
// ============================================================================

import { ComplianceMonitorId }
from "../value-objects/compliance-monitor-id";

import { MonitorStatus }
from "../enums/monitor-status";

export class ComplianceMonitor{

    constructor(

        readonly id:ComplianceMonitorId,

        readonly controlId:string,

        readonly resourceId:string,

        readonly currentStatus:MonitorStatus,

        readonly lastEvaluation:Date,

        readonly nextEvaluation:Date,

        readonly healthy:boolean

    ){}

}
