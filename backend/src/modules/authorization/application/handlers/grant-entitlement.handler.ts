// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/grant-entitlement.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { GrantEntitlementCommand }
from "../commands/grant-entitlement.command";

export class GrantEntitlementHandler
implements CommandHandler<GrantEntitlementCommand>{

    async execute(

        command:GrantEntitlementCommand

    ):Promise<void>{

        // Create Entitlement

        // Persist

        // Publish Events

    }

}
