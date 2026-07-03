// ============================================================================
// FILE: /backend/src/modules/cost/application/handlers/estimate-cost.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { EstimateCostCommand }
from "../commands/estimate-cost.command";

export class EstimateCostHandler
implements CommandHandler<EstimateCostCommand>{

    async execute(

        command:EstimateCostCommand

    ):Promise<void>{

        // Estimate Tokens

        // Estimate Cost

        // Compare Budget

    }

}
