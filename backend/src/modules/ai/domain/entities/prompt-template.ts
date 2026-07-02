// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/prompt-template.ts
// NEW FILE
// ============================================================================

import { PromptId }
from "../value-objects/prompt-id";

import { PromptType }
from "../enums/prompt-type";

import { PromptVersionStatus }
from "../enums/prompt-version-status";

export class PromptTemplate{

    constructor(

        readonly id:PromptId,

        readonly name:string,

        readonly type:PromptType,

        readonly version:string,

        readonly status:PromptVersionStatus,

        readonly content:string,

        readonly createdAt:Date

    ){}

}
