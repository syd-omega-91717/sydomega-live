// ============================================================================
// FILE: /backend/src/modules/notification/domain/events/notification-failed.event.ts
// NEW FILE
// ============================================================================

export class NotificationFailedEvent{

    constructor(

        readonly notificationId:string,

        readonly reason:string

    ){}

}
