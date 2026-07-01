// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/verify-mfa.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { VerifyMfaCommand }
from "../commands/verify-mfa.command";

export class VerifyMfaHandler
implements CommandHandler<VerifyMfaCommand>{

    async execute(

        command:VerifyMfaCommand

    ):Promise<void>{

        // Verify Challenge

        // Complete Authentication

    }

}
