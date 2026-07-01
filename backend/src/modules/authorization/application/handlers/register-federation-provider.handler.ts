// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/register-federation-provider.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterFederationProviderCommand }
from "../commands/register-federation-provider.command";

export class RegisterFederationProviderHandler
implements CommandHandler<RegisterFederationProviderCommand>{

    async execute(

        command:RegisterFederationProviderCommand

    ):Promise<void>{

        // Register Federation Provider

        // Persist

        // Publish Events

    }

}
