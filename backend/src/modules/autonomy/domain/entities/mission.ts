// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/entities/mission.ts
// NEW FILE
// ============================================================================

import { MissionId }
from "../value-objects/mission-id";

import { MissionStatus }
from "../enums/mission-status";

export class Mission{

    constructor(

        readonly id:MissionId,

        readonly tenantId:string,

        readonly objective:string,

        readonly status:MissionStatus,

        readonly priority:number,

        readonly createdAt:Date

    ){}

}
