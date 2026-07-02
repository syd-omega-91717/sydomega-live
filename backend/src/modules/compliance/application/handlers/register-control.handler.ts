// ============================================================================
// FILE: /backend/src/modules/compliance/application/handlers/register-control.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterControlCommand }
from "../commands/register-control.command";

export class RegisterControlHandler
implements CommandHandler<RegisterControlCommand>{

    async execute(

        command:RegisterControlCommand

    ):Promise<void>{

        // Register Compliance Control

    }

}
