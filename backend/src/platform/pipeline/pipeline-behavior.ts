// ============================================================================
// FILE: /backend/src/platform/pipeline/pipeline-behavior.ts
// NEW FILE
// ============================================================================

import type { Command } from "./command.js";

export interface PipelineBehavior {

    handle(

        command: Command,

        next: () => Promise<unknown>

    ): Promise<unknown>;

}
