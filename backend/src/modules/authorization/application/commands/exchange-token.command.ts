// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/exchange-token.command.ts
// NEW FILE
// ============================================================================

export class ExchangeTokenCommand{

    constructor(

        readonly subjectToken:string,

        readonly actorToken:string|null,

        readonly requestedTokenType:string

    ){}

}
