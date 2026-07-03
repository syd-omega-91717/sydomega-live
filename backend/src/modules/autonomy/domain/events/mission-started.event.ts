// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/events/mission-started.event.ts
// NEW FILE
// ============================================================================

export class MissionStartedEvent{

    constructor(

        readonly missionId:string,

        readonly objective:string

    ){}

}
