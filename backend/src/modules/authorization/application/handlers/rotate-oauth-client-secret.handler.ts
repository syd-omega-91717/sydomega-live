// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/rotate-oauth-client-secret.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RotateOAuthClientSecretCommand }
from "../commands/rotate-oauth-client-secret.command";

export class RotateOAuthClientSecretHandler
implements CommandHandler<RotateOAuthClientSecretCommand>{

    async execute(

        command:RotateOAuthClientSecretCommand

    ):Promise<void>{

        // Rotate OAuth Client Secret

    }

}
