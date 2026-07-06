// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/ScenarioSimulationManager.ts
// ============================================================================

export interface SimulationScenario{

    id:string;

    name:string;

}

export class ScenarioSimulationManager{

    private scenarios=

    new Map<string,SimulationScenario>();

    register(

        scenario:SimulationScenario

    ){

        this.scenarios.set(

            scenario.id,

            scenario

        );

    }

    execute(

        id:string

    ){

        return this.scenarios.get(id);

    }

}
