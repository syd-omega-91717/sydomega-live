// ============================================================================
// FILE:
// /enterprise/operations/PlatformOperationsOrchestrator.ts
// ============================================================================

import { AlertingEngine } from "./AlertingEngine";
import { APMEngine } from "./APMEngine";
import { CapacityPlanningEngine } from "./CapacityPlanningEngine";
import { CentralLoggingEngine } from "./CentralLoggingEngine";
import { DistributedTracingEngine } from "./DistributedTracingEngine";
import { IncidentManagementEngine } from "./IncidentManagementEngine";
import { InfrastructureMonitoringEngine } from "./InfrastructureMonitoringEngine";
import { MetricsCollectionEngine } from "./MetricsCollectionEngine";
import { ServiceHealthDashboardEngine } from "./ServiceHealthDashboardEngine";

export class PlatformOperationsOrchestrator{

    readonly logging=new CentralLoggingEngine();

    readonly tracing=new DistributedTracingEngine();

    readonly metrics=new MetricsCollectionEngine();

    readonly infrastructure=new InfrastructureMonitoringEngine();

    readonly apm=new APMEngine();

    readonly incidents=new IncidentManagementEngine();

    readonly alerts=new AlertingEngine();

    readonly dashboard=new ServiceHealthDashboardEngine();

    readonly capacity=new CapacityPlanningEngine();

}
