// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/entities/autonomous-task.ts
// NEW FILE
// ============================================================================

import { TaskState }
from "../enums/task-state";

export class AutonomousTask{

    constructor(

        readonly taskId:string,

        readonly missionId:string,

        readonly title:string,

        readonly state:TaskState,

        readonly dependencies:string[],

        readonly assignedAgent:string|null

    ){}

}
