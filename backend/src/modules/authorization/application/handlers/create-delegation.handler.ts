// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-delegation.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateDelegationCommand }
from "../commands/create-delegation.command";

export class CreateDelegationHandler
implements CommandHandler<CreateDelegationCommand>{

    async execute(

        command:CreateDelegationCommand

    ):Promise<void>{

        // Validate Delegator

        // Create Delegation

        // Persist

        // Publish Events

    }

}
