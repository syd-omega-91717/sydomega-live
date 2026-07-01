// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/revoke-entitlement.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RevokeEntitlementCommand }
from "../commands/revoke-entitlement.command";

export class RevokeEntitlementHandler
implements CommandHandler<RevokeEntitlementCommand>{

    async execute(

        command:RevokeEntitlementCommand

    ):Promise<void>{

        // Revoke

        // Persist

    }

}
