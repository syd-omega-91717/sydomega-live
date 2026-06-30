// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/disable-service-account.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { DisableServiceAccountCommand }
from "../commands/disable-service-account.command";

export class DisableServiceAccountHandler
implements CommandHandler<DisableServiceAccountCommand>{

    async execute(

        command:DisableServiceAccountCommand

    ):Promise<void>{

        // Disable account

    }

}
