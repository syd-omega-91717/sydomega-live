// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/checkout-secret.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CheckoutSecretCommand }
from "../commands/checkout-secret.command";

export class CheckoutSecretHandler
implements CommandHandler<CheckoutSecretCommand>{

    async execute(

        command:CheckoutSecretCommand

    ):Promise<void>{

        // Checkout Secret

        // Create Lease

        // Persist

    }

}
