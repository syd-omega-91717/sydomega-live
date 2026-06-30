// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/unlock-user.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { UnlockUserCommand }
from "../commands/unlock-user.command";

export class UnlockUserHandler
implements CommandHandler<UnlockUserCommand>{

    async execute(

        command:UnlockUserCommand

    ):Promise<void>{

        // Unlock User

    }

}
