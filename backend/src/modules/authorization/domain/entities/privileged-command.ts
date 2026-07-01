// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/privileged-command.ts
// NEW FILE
// ============================================================================

export class PrivilegedCommand{

    constructor(

        readonly timestamp:Date,

        readonly command:string,

        readonly target:string,

        readonly successful:boolean

    ){}

}
