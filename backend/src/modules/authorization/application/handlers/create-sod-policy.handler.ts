// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-sod-policy.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateSodPolicyCommand }
from "../commands/create-sod-policy.command";

export class CreateSodPolicyHandler
implements CommandHandler<CreateSodPolicyCommand>{

    async execute(

        command:CreateSodPolicyCommand

    ):Promise<void>{

        // Create SoD Policy

        // Persist

        // Publish Events

    }

}
