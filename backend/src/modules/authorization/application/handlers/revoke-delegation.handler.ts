// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/revoke-delegation.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RevokeDelegationCommand }
from "../commands/revoke-delegation.command";

export class RevokeDelegationHandler
implements CommandHandler<RevokeDelegationCommand>{

    async execute(

        command:RevokeDelegationCommand

    ):Promise<void>{

        // Load Aggregate

        // Revoke

        // Persist

    }

}
