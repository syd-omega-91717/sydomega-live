// ============================================================================
// FILE:
// /enterprise/kernel/CrossDomainWorkflowCoordinator.ts
// ============================================================================

export class CrossDomainWorkflowCoordinator{

    coordinate(

        workflowId:string

    ){

        return{

            workflowId,

            coordinated:true

        };

    }

}
