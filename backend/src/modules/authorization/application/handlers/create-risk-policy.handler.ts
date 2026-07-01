// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-risk-policy.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateRiskPolicyCommand }
from "../commands/create-risk-policy.command";

export class CreateRiskPolicyHandler
implements CommandHandler<CreateRiskPolicyCommand>{

    async execute(

        command:CreateRiskPolicyCommand

    ):Promise<void>{

        // Create Policy

        // Persist

        // Publish Events

    }

}
