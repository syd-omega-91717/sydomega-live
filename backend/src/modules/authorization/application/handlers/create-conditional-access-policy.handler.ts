// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-conditional-access-policy.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateConditionalAccessPolicyCommand }
from "../commands/create-conditional-access-policy.command";

export class CreateConditionalAccessPolicyHandler
implements CommandHandler<CreateConditionalAccessPolicyCommand>{

    async execute(

        command:CreateConditionalAccessPolicyCommand

    ):Promise<void>{

        // Create Policy

        // Persist

        // Publish Events

    }

}
