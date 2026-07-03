// ============================================================================
// FILE: /backend/src/modules/notification/application/services/notification.service.ts
// NEW FILE
// ============================================================================

export interface NotificationService{

    send():Promise<void>;

    schedule():Promise<void>;

    retry():Promise<void>;

    cancel():Promise<void>;

}
