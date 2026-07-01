// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/redeem-authorization-code.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RedeemAuthorizationCodeCommand }
from "../commands/redeem-authorization-code.command";

export class RedeemAuthorizationCodeHandler
implements CommandHandler<RedeemAuthorizationCodeCommand>{

    async execute(

        command:RedeemAuthorizationCodeCommand

    ):Promise<void>{

        // Verify PKCE

        // Exchange Code For Tokens

    }

}
