// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/start-access-certification.command.ts
// NEW FILE
// ============================================================================

export class StartAccessCertificationCommand{

    constructor(

        readonly name:string,

        readonly dueAt:Date

    ){}

}
