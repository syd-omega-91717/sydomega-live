// ============================================================================
// FILE: /backend/src/modules/memory/domain/entities/memory-context.ts
// NEW FILE
// ============================================================================

export class MemoryContext{

    constructor(

        readonly contextId:string,

        readonly memoryIds:string[],

        readonly reconstructedPrompt:string,

        readonly generatedAt:Date

    ){}

}
