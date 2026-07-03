// ============================================================================
// FILE: /backend/src/modules/autonomy/application/commands/start-mission.command.ts
// NEW FILE
// ============================================================================

export class StartMissionCommand{

    constructor(

        readonly objective:string,

        readonly priority:number

    ){}

}
