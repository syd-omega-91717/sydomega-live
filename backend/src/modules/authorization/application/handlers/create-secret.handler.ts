// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-secret.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateSecretCommand }
from "../commands/create-secret.command";

export class CreateSecretHandler
implements CommandHandler<CreateSecretCommand>{

    async execute(

        command:CreateSecretCommand

    ):Promise<void>{

        // Create Secret

        // Persist

        // Publish Events

    }

}
