// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/register-connector.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterConnectorCommand }
from "../commands/register-connector.command";

export class RegisterConnectorHandler
implements CommandHandler<RegisterConnectorCommand>{

    async execute(

        command:RegisterConnectorCommand

    ):Promise<void>{

        // Register Connector

        // Persist

        // Publish Events

    }

}
