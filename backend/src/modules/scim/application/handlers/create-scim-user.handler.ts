// ============================================================================
// FILE: /backend/src/modules/scim/application/handlers/create-scim-user.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { CreateScimUserCommand } from "../commands/create-scim-user.command";

export class CreateScimUserHandler
implements CommandHandler<CreateScimUserCommand>{

    async execute(

        command: CreateScimUserCommand

    ): Promise<void>{

        // Provision identity

    }

}
