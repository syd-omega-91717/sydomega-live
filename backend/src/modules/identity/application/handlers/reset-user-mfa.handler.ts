// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/reset-user-mfa.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ResetUserMfaCommand }
from "../commands/reset-user-mfa.command";

export class ResetUserMfaHandler
implements CommandHandler<ResetUserMfaCommand>{

    async execute(

        command:ResetUserMfaCommand

    ):Promise<void>{

        // Remove MFA Factors

        // Revoke Challenges

        // Publish Events

    }

}
