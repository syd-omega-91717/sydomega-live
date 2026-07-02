// ============================================================================
// FILE: /backend/src/modules/audit/application/handlers/verify-hash-chain.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { VerifyHashChainCommand }
from "../commands/verify-hash-chain.command";

export class VerifyHashChainHandler
implements CommandHandler<VerifyHashChainCommand>{

    async execute():Promise<void>{

        // Verify Entire Chain

    }

}
