// ============================================================================
// FILE:
// /enterprise/automation/BPMNWorkflowEngine.ts
// ============================================================================

import { Workflow } from "./Workflow";

export class BPMNWorkflowEngine{

    deploy(

        workflow:Workflow

    ){

        return{

            workflow,

            deployed:true

        };

    }

}
