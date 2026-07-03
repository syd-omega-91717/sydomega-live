// ============================================================================
// FILE: /backend/src/modules/autonomy/application/handlers/replan-mission.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ReplanMissionCommand }
from "../commands/replan-mission.command";

export class ReplanMissionHandler
implements CommandHandler<ReplanMissionCommand>{

    async execute(

        command:ReplanMissionCommand

    ):Promise<void>{

        // Detect Failure

        // Rebuild Plan

        // Continue Mission

    }

}
