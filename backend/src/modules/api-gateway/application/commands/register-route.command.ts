// ============================================================================
// FILE: /backend/src/modules/api-gateway/application/commands/register-route.command.ts
// NEW FILE
// ============================================================================

export class RegisterRouteCommand{

    constructor(

        readonly path:string,

        readonly upstream:string

    ){}

}
