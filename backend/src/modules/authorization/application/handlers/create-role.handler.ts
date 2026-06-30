// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-role.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateRoleCommand }
from "../commands/create-role.command";

export class CreateRoleHandler
implements CommandHandler<CreateRoleCommand>{

    async execute(

        command:CreateRoleCommand

    ):Promise<void>{

        // Create Role

        // Persist

        // Publish Events

    }

}
