// ============================================================================
// FILE:
// /enterprise/simulation/SimulationOrchestrator.ts
// ============================================================================

import { AgentSimulationEngine } from "./AgentSimulationEngine";
import { ForecastEngine } from "./ForecastEngine";
import { MissionRehearsalEngine } from "./MissionRehearsalEngine";
import { MonteCarloEngine } from "./MonteCarloEngine";
import { ScenarioSimulationEngine } from "./ScenarioSimulationEngine";
import { SimulationAnalyticsEngine } from "./SimulationAnalyticsEngine";
import { SyntheticDataGenerator } from "./SyntheticDataGenerator";
import { SystemModelEngine } from "./SystemModelEngine";
import { TrainingEnvironmentEngine } from "./TrainingEnvironmentEngine";

export class SimulationOrchestrator{

    readonly scenarios=

    new ScenarioSimulationEngine();

    readonly syntheticData=

    new SyntheticDataGenerator();

    readonly rehearsal=

    new MissionRehearsalEngine();

    readonly agents=

    new AgentSimulationEngine();

    readonly monteCarlo=

    new MonteCarloEngine();

    readonly forecasting=

    new ForecastEngine();

    readonly systems=

    new SystemModelEngine();

    readonly training=

    new TrainingEnvironmentEngine();

    readonly analytics=

    new SimulationAnalyticsEngine();

}
