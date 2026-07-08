// ============================================================================
// FILE:
// /enterprise/workflow/BPMNWorkflowEngine.ts
// ============================================================================

import { WorkflowDefinition } from "./WorkflowDefinition";

export class BPMNWorkflowEngine{

    deploy(

        workflow:WorkflowDefinition

    ){

        return{

            deployed:true,

            workflow

        };

    }

}
