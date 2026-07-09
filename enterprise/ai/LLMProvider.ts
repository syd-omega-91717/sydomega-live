// ============================================================================
// ENTERPRISE CORE EC-028
// FILE:
// /enterprise/ai/LLMProvider.ts
// ============================================================================

export interface LLMProvider{

    id:string;

    name:string;

    model:string;

    endpoint:string;

    enabled:boolean;

}
