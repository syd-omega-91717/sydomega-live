// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/certify-access.command.ts
// NEW FILE
// ============================================================================

export class CertifyAccessCommand{

    constructor(

        readonly certificationId:string,

        readonly userId:string,

        readonly roleId:string,

        readonly approved:boolean

    ){}

}
