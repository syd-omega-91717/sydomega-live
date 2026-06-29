// ============================================================================
// FILE: /backend/src/kernel/workflow/workflow-manager.ts
// NEW FILE
// ============================================================================

import { Workflow }

from "./workflow.js";

export class WorkflowManager {

    private readonly workflows =

        new Map<string, Workflow<any>>();

    register(

        workflow: Workflow<any>

    ): void {

        this.workflows.set(

            workflow.id,

            workflow

        );

    }

    async start(

        id: string,

        context: unknown

    ): Promise<void> {

        const workflow =

            this.workflows.get(id);

        if (!workflow) {

            throw new Error(

                `Workflow '${id}' not found.`

            );

        }

        await workflow.execute(

            context

        );

    }

}
