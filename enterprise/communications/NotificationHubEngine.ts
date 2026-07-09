// ============================================================================
// FILE:
// /enterprise/communications/NotificationHubEngine.ts
// ============================================================================

export class NotificationHubEngine{

    notify(

        recipientId:string,

        notificationType:string

    ){

        return{

            recipientId,

            notificationType,

            delivered:true

        };

    }

}
