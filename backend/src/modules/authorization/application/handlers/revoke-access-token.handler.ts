// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/revoke-access-token.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RevokeAccessTokenCommand }
from "../commands/revoke-access-token.command";

export class RevokeAccessTokenHandler
implements CommandHandler<RevokeAccessTokenCommand>{

    async execute(

        command:RevokeAccessTokenCommand

    ):Promise<void>{

        // Revoke Token

        // Persist

    }

}
