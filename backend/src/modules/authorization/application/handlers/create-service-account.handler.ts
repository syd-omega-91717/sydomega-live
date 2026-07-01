// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-service-account.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateServiceAccountCommand }
from "../commands/create-service-account.command";

export class CreateServiceAccountHandler
implements CommandHandler<CreateServiceAccountCommand>{

    async execute(

        command:CreateServiceAccountCommand

    ):Promise<void>{

        // Create Service Account

        // Persist

        // Publish Events

    }

}
