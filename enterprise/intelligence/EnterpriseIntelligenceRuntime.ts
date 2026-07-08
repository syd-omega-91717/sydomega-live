// ============================================================================
// FILE:
// /enterprise/intelligence/EnterpriseIntelligenceRuntime.ts
// ============================================================================

import { AnomalyDetectionEngine } from "./AnomalyDetectionEngine";
import { DashboardEngine } from "./DashboardEngine";
import { DataWarehouseConnector } from "./DataWarehouseConnector";
import { DecisionEngine } from "./DecisionEngine";
import { ExecutiveReportingEngine } from "./ExecutiveReportingEngine";
import { ForecastEngine } from "./ForecastEngine";
import { KPIEngine } from "./KPIEngine";
import { OLAPEngine } from "./OLAPEngine";
import { ScorecardEngine } from "./ScorecardEngine";
import { StrategicPlanningEngine } from "./StrategicPlanningEngine";

export class EnterpriseIntelligenceRuntime{

    readonly kpis=

    new KPIEngine();

    readonly dashboards=

    new DashboardEngine();

    readonly olap=

    new OLAPEngine();

    readonly warehouse=

    new DataWarehouseConnector();

    readonly forecasting=

    new ForecastEngine();

    readonly anomalies=

    new AnomalyDetectionEngine();

    readonly reports=

    new ExecutiveReportingEngine();

    readonly scorecards=

    new ScorecardEngine();

    readonly planning=

    new StrategicPlanningEngine();

    readonly decisions=

    new DecisionEngine();

}
