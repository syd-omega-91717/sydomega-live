// ============================================================================
// FILE: /backend/src/modules/tools/domain/entities/tool.ts
// NEW FILE
// ============================================================================

import { ToolId }
from "../value-objects/tool-id";

import { ToolType }
from "../enums/tool-type";

export class Tool{

    constructor(

        readonly id:ToolId,

        readonly name:string,

        readonly type:ToolType,

        readonly version:string,

        readonly permissions:string[],

        readonly timeout:number,

        readonly enabled:boolean

    ){}

}
