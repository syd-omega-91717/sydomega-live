// ============================================================================
// FILE: /backend/src/modules/audit/application/handlers/replay-events.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ReplayEventsCommand }
from "../commands/replay-events.command";

export class ReplayEventsHandler
implements CommandHandler<ReplayEventsCommand>{

    async execute(

        command:ReplayEventsCommand

    ):Promise<void>{

        // Replay Aggregate Events

    }

}
