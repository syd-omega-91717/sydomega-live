// ============================================================================
// FILE: /backend/src/modules/evaluation/application/handlers/start-evaluation.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { StartEvaluationCommand }
from "../commands/start-evaluation.command";

export class StartEvaluationHandler
implements CommandHandler<StartEvaluationCommand>{

    async execute(

        command:StartEvaluationCommand

    ):Promise<void>{

        // Load Golden Dataset

        // Execute Benchmarks

        // Persist Results

    }

}
