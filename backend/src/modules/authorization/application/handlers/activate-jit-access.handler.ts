// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/activate-jit-access.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ActivateJitAccessCommand }
from "../commands/activate-jit-access.command";

export class ActivateJitAccessHandler
implements CommandHandler<ActivateJitAccessCommand>{

    async execute(

        command:ActivateJitAccessCommand

    ):Promise<void>{

        // Activate Access

        // Provision Resources

        // Persist

    }

}
