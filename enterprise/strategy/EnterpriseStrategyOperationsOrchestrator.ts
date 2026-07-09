// ============================================================================
// FILE:
// /enterprise/strategy/EnterpriseStrategyOperationsOrchestrator.ts
// ============================================================================

import { BalancedScorecardEngine } from "./BalancedScorecardEngine";
import { EnterpriseArchitectureRepositoryEngine } from "./EnterpriseArchitectureRepositoryEngine";
import { EnterprisePortfolioManagementEngine } from "./EnterprisePortfolioManagementEngine";
import { ExecutiveDashboardEngine } from "./ExecutiveDashboardEngine";
import { ExecutiveDecisionIntelligenceEngine } from "./ExecutiveDecisionIntelligenceEngine";
import { KPIPerformanceEngine } from "./KPIPerformanceEngine";
import { ProjectPortfolioManagementEngine } from "./ProjectPortfolioManagementEngine";
import { ScenarioSimulationEngine } from "./ScenarioSimulationEngine";
import { StrategicPlanningEngine } from "./StrategicPlanningEngine";

export class EnterpriseStrategyOperationsOrchestrator{

    readonly portfolio=new EnterprisePortfolioManagementEngine();

    readonly planning=new StrategicPlanningEngine();

    readonly dashboards=new ExecutiveDashboardEngine();

    readonly ppm=new ProjectPortfolioManagementEngine();

    readonly architecture=new EnterpriseArchitectureRepositoryEngine();

    readonly scorecard=new BalancedScorecardEngine();

    readonly kpi=new KPIPerformanceEngine();

    readonly scenarios=new ScenarioSimulationEngine();

    readonly executiveAI=new ExecutiveDecisionIntelligenceEngine();

}
