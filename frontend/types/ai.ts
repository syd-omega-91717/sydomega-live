// ============================================================================
// FILE:
// /frontend/types/ai.ts
// ============================================================================

export interface AIConversation{

    id:string;

    title:string;

    createdAt:string;

    updatedAt:string;

}

export interface AIMessage{

    id:string;

    conversationId:string;

    role:"system"|"user"|"assistant";

    content:string;

    timestamp:string;

}

export interface AIModel{

    id:string;

    provider:string;

    displayName:string;

    contextWindow:number;

    enabled:boolean;

}
