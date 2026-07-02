// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/prompt-variable.ts
// NEW FILE
// ============================================================================

export class PromptVariable{

    constructor(

        readonly name:string,

        readonly type:string,

        readonly required:boolean,

        readonly defaultValue:string|null

    ){}

}
