// ============================================================================
// FILE: /backend/src/modules/saml/application/commands/process-response.command.ts
// NEW FILE
// ============================================================================

export class ProcessSamlResponseCommand {

    constructor(

        readonly samlResponse: string,

        readonly relayState?: string

    ) {}

}
