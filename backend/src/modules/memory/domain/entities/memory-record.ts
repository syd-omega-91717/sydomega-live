// ============================================================================
// FILE: /backend/src/modules/memory/domain/entities/memory-record.ts
// NEW FILE
// ============================================================================

import { MemoryId }
from "../value-objects/memory-id";

import { MemoryType }
from "../enums/memory-type";

import { MemoryState }
from "../enums/memory-state";

export class MemoryRecord{

    constructor(

        readonly id:MemoryId,

        readonly tenantId:string,

        readonly agentId:string,

        readonly type:MemoryType,

        readonly state:MemoryState,

        readonly embeddingId:string,

        readonly importance:number,

        readonly createdAt:Date

    ){}

}
