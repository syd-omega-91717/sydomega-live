// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-mfa-policy.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateMfaPolicyCommand }
from "../commands/create-mfa-policy.command";

export class CreateMfaPolicyHandler
implements CommandHandler<CreateMfaPolicyCommand>{

    async execute(

        command:CreateMfaPolicyCommand

    ):Promise<void>{

        // Create MFA Policy

        // Persist

        // Publish Events

    }

}
