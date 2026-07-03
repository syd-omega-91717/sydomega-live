// ============================================================================
// FILE: /backend/src/modules/notification/application/commands/schedule-notification.command.ts
// NEW FILE
// ============================================================================

export class ScheduleNotificationCommand{

    constructor(

        readonly notificationId:string,

        readonly executeAt:Date

    ){}

}
