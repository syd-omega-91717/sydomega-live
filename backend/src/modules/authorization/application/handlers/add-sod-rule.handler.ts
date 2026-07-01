// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/add-sod-rule.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AddSodRuleCommand }
from "../commands/add-sod-rule.command";

export class AddSodRuleHandler
implements CommandHandler<AddSodRuleCommand>{

    async execute(

        command:AddSodRuleCommand

    ):Promise<void>{

        // Add Rule

        // Persist

    }

}
