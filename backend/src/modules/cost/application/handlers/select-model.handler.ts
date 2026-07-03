// ============================================================================
// FILE: /backend/src/modules/cost/application/handlers/select-model.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SelectModelCommand }
from "../commands/select-model.command";

export class SelectModelHandler
implements CommandHandler<SelectModelCommand>{

    async execute(

        command:SelectModelCommand

    ):Promise<void>{

        // Select Lowest Cost

        // Preserve Quality

        // Route Request

    }

}
