// ============================================================================
// FILE: /backend/src/modules/cache/application/handlers/cache-put.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CachePutCommand }
from "../commands/cache-put.command";

export class CachePutHandler
implements CommandHandler<CachePutCommand>{

    async execute(

        command:CachePutCommand

    ):Promise<void>{

        // Serialize

        // Store

        // Replicate

        // Publish Metrics

    }

}
