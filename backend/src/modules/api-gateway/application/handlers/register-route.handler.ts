// ============================================================================
// FILE: /backend/src/modules/api-gateway/application/handlers/register-route.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterRouteCommand }
from "../commands/register-route.command";

export class RegisterRouteHandler
implements CommandHandler<RegisterRouteCommand>{

    async execute(
        command:RegisterRouteCommand
    ):Promise<void>{

        // Validate upstream

        // Register gateway route

        // Publish gateway event

    }

}
