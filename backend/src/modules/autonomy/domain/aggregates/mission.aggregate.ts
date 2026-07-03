// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/aggregates/mission.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { MissionId }
from "../value-objects/mission-id";

export class MissionAggregate
extends AggregateRoot<MissionId>{

    decomposeGoal(){}

    buildExecutionGraph(){}

    assignAgents(){}

    replan(){}

    finalize(){}

}
