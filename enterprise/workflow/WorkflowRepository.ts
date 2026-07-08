// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowRepository.ts
// ============================================================================

import { WorkflowDefinition } from "./WorkflowDefinition";

export class WorkflowRepository{

    private readonly workflows=

    new Map<string,WorkflowDefinition>();

    save(

        workflow:WorkflowDefinition

    ){

        this.workflows.set(

            workflow.id,

            workflow

        );

    }

    find(

        id:string

    ){

        return this.workflows.get(id);

    }

}
