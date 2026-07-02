// ============================================================================
// FILE: /backend/src/modules/compliance/application/commands/create-framework-mapping.command.ts
// NEW FILE
// ============================================================================

export class CreateFrameworkMappingCommand{

    constructor(

        readonly sourceFramework:string,

        readonly sourceControl:string,

        readonly targetFramework:string,

        readonly targetControl:string

    ){}

}
