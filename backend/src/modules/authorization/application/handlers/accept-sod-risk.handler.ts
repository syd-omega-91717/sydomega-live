// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/accept-sod-risk.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AcceptSodRiskCommand }
from "../commands/accept-sod-risk.command";

export class AcceptSodRiskHandler
implements CommandHandler<AcceptSodRiskCommand>{

    async execute(

        command:AcceptSodRiskCommand

    ):Promise<void>{

        // Accept Risk

        // Persist

    }

}
