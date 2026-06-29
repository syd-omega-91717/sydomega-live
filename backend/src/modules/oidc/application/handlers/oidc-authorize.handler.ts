// ============================================================================
// FILE: /backend/src/modules/oidc/application/handlers/oidc-authorize.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";

import { OidcAuthorizeCommand }
from "../commands/authorize/oidc-authorize.command";

export class OidcAuthorizeHandler
implements CommandHandler<OidcAuthorizeCommand>{

    async execute(

        command: OidcAuthorizeCommand

    ): Promise<void>{

        // Authentication

        // Consent

        // Authorization Code

        // ID Token

        // Events

    }

}
