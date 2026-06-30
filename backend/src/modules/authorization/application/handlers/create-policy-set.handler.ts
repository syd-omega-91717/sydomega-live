// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-policy-set.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreatePolicySetCommand }
from "../commands/create-policy-set.command";

export class CreatePolicySetHandler
implements CommandHandler<CreatePolicySetCommand>{

    async execute(

        command:CreatePolicySetCommand

    ):Promise<void>{

        // Create Aggregate

        // Persist

        // Publish Events

    }

}
