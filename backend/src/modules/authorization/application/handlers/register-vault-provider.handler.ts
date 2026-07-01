// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/register-vault-provider.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterVaultProviderCommand }
from "../commands/register-vault-provider.command";

export class RegisterVaultProviderHandler
implements CommandHandler<RegisterVaultProviderCommand>{

    async execute(

        command:RegisterVaultProviderCommand

    ):Promise<void>{

        // Register Provider

        // Persist

        // Publish Events

    }

}
