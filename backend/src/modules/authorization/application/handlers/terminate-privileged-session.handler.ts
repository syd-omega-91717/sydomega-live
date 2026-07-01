// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/terminate-privileged-session.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { TerminatePrivilegedSessionCommand }
from "../commands/terminate-privileged-session.command";

export class TerminatePrivilegedSessionHandler
implements CommandHandler<TerminatePrivilegedSessionCommand>{

    async execute(

        command:TerminatePrivilegedSessionCommand

    ):Promise<void>{

        // Terminate Session

        // Persist

    }

}
