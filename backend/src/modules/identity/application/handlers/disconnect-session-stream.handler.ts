// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/disconnect-session-stream.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { DisconnectSessionStreamCommand }
from "../commands/disconnect-session-stream.command";

export class DisconnectSessionStreamHandler
implements CommandHandler<DisconnectSessionStreamCommand>{

    async execute(

        command:DisconnectSessionStreamCommand

    ):Promise<void>{

        // Remove connection

    }

}
