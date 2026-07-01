// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/synchronize-vault-provider.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SynchronizeVaultProviderCommand }
from "../commands/synchronize-vault-provider.command";

export class SynchronizeVaultProviderHandler
implements CommandHandler<SynchronizeVaultProviderCommand>{

    async execute(

        command:SynchronizeVaultProviderCommand

    ):Promise<void>{

        // Synchronize Provider

    }

}
