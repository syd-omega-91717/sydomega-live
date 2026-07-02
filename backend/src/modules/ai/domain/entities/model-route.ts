// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/model-route.ts
// NEW FILE
// ============================================================================

import { LLMProvider }
from "../enums/llm-provider";

import { ModelRole }
from "../enums/model-role";

export class ModelRoute{

    constructor(

        readonly provider:LLMProvider,

        readonly model:string,

        readonly role:ModelRole,

        readonly priority:number,

        readonly enabled:boolean

    ){}

}
