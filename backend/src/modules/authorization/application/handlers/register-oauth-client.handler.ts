// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/register-oauth-client.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterOAuthClientCommand }
from "../commands/register-oauth-client.command";

export class RegisterOAuthClientHandler
implements CommandHandler<RegisterOAuthClientCommand>{

    async execute(

        command:RegisterOAuthClientCommand

    ):Promise<void>{

        // Register OAuth Client

        // Persist

        // Publish Events

    }

}
