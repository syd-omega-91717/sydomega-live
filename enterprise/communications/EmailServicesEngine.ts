// ============================================================================
// FILE:
// /enterprise/communications/EmailServicesEngine.ts
// ============================================================================

export class EmailServicesEngine{

    deliver(

        emailId:string

    ){

        return{

            emailId,

            delivered:true

        };

    }

}
