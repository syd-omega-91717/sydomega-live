// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/assign-role.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AssignRoleCommand }
from "../commands/assign-role.command";

export class AssignRoleHandler
implements CommandHandler<AssignRoleCommand>{

    async execute(

        command:AssignRoleCommand

    ):Promise<void>{

        // Assign Role

        // Persist Assignment

    }

}
