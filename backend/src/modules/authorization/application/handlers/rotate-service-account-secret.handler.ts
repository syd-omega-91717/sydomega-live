// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/rotate-service-account-secret.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RotateServiceAccountSecretCommand }
from "../commands/rotate-service-account-secret.command";

export class RotateServiceAccountSecretHandler
implements CommandHandler<RotateServiceAccountSecretCommand>{

    async execute(

        command:RotateServiceAccountSecretCommand

    ):Promise<void>{

        // Rotate Secret

        // Persist

    }

}
