// ============================================================================
// FILE: /backend/src/modules/audit/application/handlers/append-event.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AppendEventCommand }
from "../commands/append-event.command";

export class AppendEventHandler
implements CommandHandler<AppendEventCommand>{

    async execute(

        command:AppendEventCommand

    ):Promise<void>{

        // Persist Event

        // Advance Stream Version

        // Publish Event

    }

}
