// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/create-service-account.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { CreateServiceAccountCommand }
from "../commands/create-service-account.command";

export class CreateServiceAccountHandler
implements CommandHandler<CreateServiceAccountCommand>{

    async execute(

        command:CreateServiceAccountCommand

    ):Promise<void>{

        // Create aggregate

        // Generate credentials

        // Persist

        // Publish events

    }

}
