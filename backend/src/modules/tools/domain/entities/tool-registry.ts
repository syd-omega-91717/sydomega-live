// ============================================================================
// FILE: /backend/src/modules/tools/domain/entities/tool-registry.ts
// NEW FILE
// ============================================================================

export class ToolRegistry{

    constructor(

        readonly registryId:string,

        readonly totalTools:number,

        readonly activeTools:number,

        readonly lastRefresh:Date

    ){}

}
