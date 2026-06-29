// ============================================================================
// FILE: /backend/src/modules/oidc/application/handlers/grant-consent.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { GrantConsentCommand } from "../commands/consent/grant-consent.command";

export class GrantConsentHandler
implements CommandHandler<GrantConsentCommand>{

    async execute(

        command: GrantConsentCommand

    ): Promise<void>{

        // Persist consent

        // Publish domain events

    }

}
