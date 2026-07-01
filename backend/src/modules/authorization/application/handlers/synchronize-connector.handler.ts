// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/synchronize-connector.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SynchronizeConnectorCommand }
from "../commands/synchronize-connector.command";

export class SynchronizeConnectorHandler
implements CommandHandler<SynchronizeConnectorCommand>{

    async execute(

        command:SynchronizeConnectorCommand

    ):Promise<void>{

        // Synchronize Connector

        // Update State

    }

}
