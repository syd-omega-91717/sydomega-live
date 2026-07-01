// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-access-package.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateAccessPackageCommand }
from "../commands/create-access-package.command";

export class CreateAccessPackageHandler
implements CommandHandler<CreateAccessPackageCommand>{

    async execute(

        command:CreateAccessPackageCommand

    ):Promise<void>{

        // Create Aggregate

        // Persist

        // Publish Events

    }

}
