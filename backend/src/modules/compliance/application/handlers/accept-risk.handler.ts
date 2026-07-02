// ============================================================================
// FILE: /backend/src/modules/compliance/application/handlers/accept-risk.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AcceptRiskCommand }
from "../commands/accept-risk.command";

export class AcceptRiskHandler
implements CommandHandler<AcceptRiskCommand>{

    async execute(

        command:AcceptRiskCommand

    ):Promise<void>{

        // Approve Risk Acceptance

    }

}
