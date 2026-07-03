// ============================================================================
// FILE: /backend/src/modules/autonomy/infrastructure/repositories/mission.repository.ts
// NEW FILE
// ============================================================================

import { MissionAggregate }
from "../../domain/aggregates/mission.aggregate";

export interface MissionRepository{

    save(

        aggregate:MissionAggregate

    ):Promise<void>;

    find(

        missionId:string

    ):Promise<MissionAggregate|null>;

}
