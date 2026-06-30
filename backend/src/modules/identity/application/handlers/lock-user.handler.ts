// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/lock-user.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { LockUserCommand }
from "../commands/lock-user.command";

export class LockUserHandler
implements CommandHandler<LockUserCommand>{

    async execute(

        command:LockUserCommand

    ):Promise<void>{

        // Load Aggregate

        // Lock User

        // Persist

        // Publish Events

    }

}
