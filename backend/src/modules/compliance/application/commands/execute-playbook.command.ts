// ============================================================================
// FILE: /backend/src/modules/compliance/application/commands/execute-playbook.command.ts
// NEW FILE
// ============================================================================

export class ExecutePlaybookCommand{

    constructor(

        readonly playbookId:string,

        readonly resourceId:string

    ){}

}
