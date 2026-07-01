// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-api-key.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateApiKeyCommand }
from "../commands/create-api-key.command";

export class CreateApiKeyHandler
implements CommandHandler<CreateApiKeyCommand>{

    async execute(

        command:CreateApiKeyCommand

    ):Promise<void>{

        // Create API Key

        // Persist

        // Publish Events

    }

}
