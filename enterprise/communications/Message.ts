// ============================================================================
// ENTERPRISE CORE EC-046
// FILE:
// /enterprise/communications/Message.ts
// ============================================================================

export interface Message{

    id:string;

    senderId:string;

    recipientId:string;

    subject:string;

    body:string;

    createdAt:string;

}
