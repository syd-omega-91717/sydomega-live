// ============================================================================
// FILE: /backend/src/types/Notification.ts
// NEW FILE
// ============================================================================

export interface Notification {

    id: string;

    recipient: string;

    sender: string;

    title: string;

    body: string;

    status: string;

    notification_type: string;

    action_url?: string | null;

    approval_request_id?: string;

    created_at?: Date;

    read_at?: Date | null;

}
