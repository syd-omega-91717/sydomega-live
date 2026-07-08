// ============================================================================
// FILE:
// /core/ai/AIResponse.ts
// ============================================================================

export interface AIResponse{

    success:boolean;

    model:string;

    agent:string;

    output:unknown;

    executionTime:number;

}
