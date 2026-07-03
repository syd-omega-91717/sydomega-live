// ============================================================================
// FILE: /backend/src/modules/autonomy/application/services/autonomy.service.ts
// NEW FILE
// ============================================================================

import { ExecutionPlan }
from "../../domain/entities/execution-plan";

export interface AutonomyService{

    createMission(

        objective:string

    ):Promise<ExecutionPlan>;

    replan(

        missionId:string

    ):Promise<void>;

    terminate(

        missionId:string

    ):Promise<void>;

}
