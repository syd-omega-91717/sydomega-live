// ============================================================================
// FILE: /backend/src/modules/scim/application/handlers/update-scim-user.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { UpdateScimUserCommand } from "../commands/update-scim-user.command";

export class UpdateScimUserHandler
implements CommandHandler<UpdateScimUserCommand>{

    async execute(

        command: UpdateScimUserCommand

    ): Promise<void>{

        // Apply PATCH operations

    }

}
