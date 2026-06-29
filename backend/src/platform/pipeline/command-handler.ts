// ============================================================================
// FILE: /backend/src/platform/pipeline/command-handler.ts
// NEW FILE
// ============================================================================

import type { Command } from "./command.js";

export interface CommandHandler<TCommand extends Command, TResult> {

    execute(

        command: TCommand

    ): Promise<TResult>;

}
