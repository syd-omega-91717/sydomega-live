// ============================================================================
// FILE:
// /enterprise/intelligence/Goal.ts
// ============================================================================

export interface Goal{

    id:string;

    description:string;

    priority:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";

    owner:string;

    completed:boolean;

}
