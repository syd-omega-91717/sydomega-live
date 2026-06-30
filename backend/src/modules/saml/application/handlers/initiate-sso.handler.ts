// ============================================================================
// FILE: /backend/src/modules/saml/application/handlers/initiate-sso.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { InitiateSsoCommand } from "../commands/initiate-sso.command";

export class InitiateSsoHandler
implements CommandHandler<InitiateSsoCommand>{

    async execute(

        command: InitiateSsoCommand

    ): Promise<void>{

        // Generate AuthnRequest

    }

}
