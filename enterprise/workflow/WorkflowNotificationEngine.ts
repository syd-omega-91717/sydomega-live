// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowNotificationEngine.ts
// ============================================================================

export class WorkflowNotificationEngine{

    notify(

        userId:string,

        message:string

    ){

        return{

            delivered:true,

            userId,

            message

        };

    }

}
