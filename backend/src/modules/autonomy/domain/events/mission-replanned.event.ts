// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/events/mission-replanned.event.ts
// NEW FILE
// ============================================================================

export class MissionReplannedEvent{

    constructor(

        readonly missionId:string,

        readonly version:number

    ){}

}
