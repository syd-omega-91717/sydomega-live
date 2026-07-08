// ============================================================================
// FILE:
// /core/ai/AIContext.ts
// ============================================================================

export interface AIContext{

    sessionId:string;

    userId:string;

    prompt:string;

    memoryId?:string;

    metadata?:Record<string,unknown>;

    timestamp:number;

}
