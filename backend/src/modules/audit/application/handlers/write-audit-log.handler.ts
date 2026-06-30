// ============================================================================
// FILE: /backend/src/modules/audit/application/handlers/write-audit-log.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { WriteAuditLogCommand }
from "../commands/write-audit-log.command";

export class WriteAuditLogHandler
implements CommandHandler<WriteAuditLogCommand>{

    async execute(

        command:WriteAuditLogCommand

    ):Promise<void>{

        // Build Audit Log

        // Persist

        // Publish Event

    }

}
