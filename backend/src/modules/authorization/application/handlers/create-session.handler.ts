// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-session.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateSessionCommand }
from "../commands/create-session.command";

export class CreateSessionHandler
implements CommandHandler<CreateSessionCommand>{

    async execute(

        command:CreateSessionCommand

    ):Promise<void>{

        // Create Session

        // Persist

        // Publish Events

    }

}
