// ============================================================================
// FILE:
// /enterprise/energy/EnergyUtilitiesOperationsOrchestrator.ts
// ============================================================================

import { CarbonManagementEngine } from "./CarbonManagementEngine";
import { ClimateIntelligenceEngine } from "./ClimateIntelligenceEngine";
import { EnvironmentalMonitoringEngine } from "./EnvironmentalMonitoringEngine";
import { OilGasOperationsEngine } from "./OilGasOperationsEngine";
import { PowerGenerationEngine } from "./PowerGenerationEngine";
import { RenewableEnergyEngine } from "./RenewableEnergyEngine";
import { SmartGridEngine } from "./SmartGridEngine";
import { UtilityAssetManagementEngine } from "./UtilityAssetManagementEngine";
import { WaterNetworkEngine } from "./WaterNetworkEngine";

export class EnergyUtilitiesOperationsOrchestrator{

    readonly smartGrid=new SmartGridEngine();

    readonly generation=new PowerGenerationEngine();

    readonly renewable=new RenewableEnergyEngine();

    readonly water=new WaterNetworkEngine();

    readonly oilGas=new OilGasOperationsEngine();

    readonly environment=new EnvironmentalMonitoringEngine();

    readonly carbon=new CarbonManagementEngine();

    readonly climate=new ClimateIntelligenceEngine();

    readonly assets=new UtilityAssetManagementEngine();

}
