// ============================================================================
// FILE: /backend/src/modules/notification/application/commands/send-notification.command.ts
// NEW FILE
// ============================================================================

export class SendNotificationCommand{

    constructor(

        readonly recipient:string,

        readonly channel:string,

        readonly template:string

    ){}

}
