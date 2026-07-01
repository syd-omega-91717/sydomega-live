// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/mitigate-sod-conflict.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { MitigateSodConflictCommand }
from "../commands/mitigate-sod-conflict.command";

export class MitigateSodConflictHandler
implements CommandHandler<MitigateSodConflictCommand>{

    async execute(

        command:MitigateSodConflictCommand

    ):Promise<void>{

        // Apply Mitigation

        // Persist

        // Publish Events

    }

}
