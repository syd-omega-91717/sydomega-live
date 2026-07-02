// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/exchange-token.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ExchangeTokenCommand }
from "../commands/exchange-token.command";

export class ExchangeTokenHandler
implements CommandHandler<ExchangeTokenCommand>{

    async execute(

        command:ExchangeTokenCommand

    ):Promise<void>{

        // RFC8693 Token Exchange

    }

}
