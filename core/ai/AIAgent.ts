// ============================================================================
// FOUNDATION KERNEL FK-009
// FILE:
// /core/ai/AIAgent.ts
// ============================================================================

export interface AIAgent{

    id:string;

    code:string;

    name:string;

    description:string;

    enabled:boolean;

    execute(

        input:unknown

    ):Promise<unknown>;

}
