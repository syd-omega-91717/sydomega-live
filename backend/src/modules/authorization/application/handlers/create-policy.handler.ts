// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-policy.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreatePolicyCommand }
from "../commands/create-policy.command";

export class CreatePolicyHandler
implements CommandHandler<CreatePolicyCommand>{

    async execute(

        command:CreatePolicyCommand

    ):Promise<void>{

        // Create Aggregate

        // Persist

        // Publish Events

    }

}
