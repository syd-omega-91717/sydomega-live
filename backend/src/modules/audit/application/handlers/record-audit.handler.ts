// ============================================================================
// FILE: /backend/src/modules/audit/application/handlers/record-audit.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RecordAuditCommand }
from "../commands/record-audit.command";

export class RecordAuditHandler
implements CommandHandler<RecordAuditCommand>{

    async execute(

        command:RecordAuditCommand

    ):Promise<void>{

        // Create Audit Record

        // Persist

        // Publish Event

    }

}
