// ============================================================================
// FILE: /backend/src/modules/memory/domain/entities/memory-episode.ts
// NEW FILE
// ============================================================================

export class MemoryEpisode{

    constructor(

        readonly episodeId:string,

        readonly memoryId:string,

        readonly summary:string,

        readonly startTime:Date,

        readonly endTime:Date,

        readonly confidence:number

    ){}

}
