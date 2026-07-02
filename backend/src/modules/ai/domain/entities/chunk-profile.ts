// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/chunk-profile.ts
// NEW FILE
// ============================================================================

import { ChunkingStrategy }
from "../enums/chunking-strategy";

export class ChunkProfile{

    constructor(

        readonly profileId:string,

        readonly strategy:ChunkingStrategy,

        readonly chunkSize:number,

        readonly overlap:number,

        readonly preserveStructure:boolean

    ){}

}
