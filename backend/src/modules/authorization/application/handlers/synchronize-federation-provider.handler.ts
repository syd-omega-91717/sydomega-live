// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/synchronize-federation-provider.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SynchronizeFederationProviderCommand }
from "../commands/synchronize-federation-provider.command";

export class SynchronizeFederationProviderHandler
implements CommandHandler<SynchronizeFederationProviderCommand>{

    async execute(

        command:SynchronizeFederationProviderCommand

    ):Promise<void>{

        // Synchronize Federation Metadata

    }

}
