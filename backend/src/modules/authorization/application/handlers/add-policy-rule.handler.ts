// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/add-policy-rule.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AddPolicyRuleCommand }
from "../commands/add-policy-rule.command";

export class AddPolicyRuleHandler
implements CommandHandler<AddPolicyRuleCommand>{

    async execute(

        command:AddPolicyRuleCommand

    ):Promise<void>{

        // Load Aggregate

        // Add Rule

        // Persist

    }

}
