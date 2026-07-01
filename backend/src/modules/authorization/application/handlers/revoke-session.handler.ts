// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/revoke-session.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RevokeSessionCommand }
from "../commands/revoke-session.command";

export class RevokeSessionHandler
implements CommandHandler<RevokeSessionCommand>{

    async execute(

        command:RevokeSessionCommand

    ):Promise<void>{

        // Revoke Session

        // Persist

    }

}
