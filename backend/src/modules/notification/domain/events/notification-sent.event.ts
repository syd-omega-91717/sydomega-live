// ============================================================================
// FILE: /backend/src/modules/notification/domain/events/notification-sent.event.ts
// NEW FILE
// ============================================================================

export class NotificationSentEvent{

    constructor(

        readonly notificationId:string,

        readonly channel:string

    ){}

}
