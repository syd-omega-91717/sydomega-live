// ============================================================================
// FILE: /backend/src/modules/oidc/application/handlers/end-session.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";

import { EndSessionCommand }
from "../commands/logout/end-session.command";

export class EndSessionHandler
implements CommandHandler<EndSessionCommand>{

    async execute(

        command: EndSessionCommand

    ): Promise<void>{

        // Revoke session

        // Publish logout event

    }

}
