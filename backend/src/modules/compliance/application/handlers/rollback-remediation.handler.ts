// ============================================================================
// FILE: /backend/src/modules/compliance/application/handlers/rollback-remediation.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RollbackRemediationCommand }
from "../commands/rollback-remediation.command";

export class RollbackRemediationHandler
implements CommandHandler<RollbackRemediationCommand>{

    async execute(

        command:RollbackRemediationCommand

    ):Promise<void>{

        // Restore Previous State

    }

}
