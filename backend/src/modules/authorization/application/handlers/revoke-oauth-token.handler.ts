// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/revoke-oauth-token.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RevokeOAuthTokenCommand }
from "../commands/revoke-oauth-token.command";

export class RevokeOAuthTokenHandler
implements CommandHandler<RevokeOAuthTokenCommand>{

    async execute(

        command:RevokeOAuthTokenCommand

    ):Promise<void>{

        // RFC7009 Revocation

    }

}
