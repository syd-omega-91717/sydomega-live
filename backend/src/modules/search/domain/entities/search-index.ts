// ============================================================================
// FILE: /backend/src/modules/search/domain/entities/search-index.ts
// NEW FILE
// ============================================================================

import { IndexId }
from "../value-objects/index-id";

import { IndexStatus }
from "../enums/index-status";

export class SearchIndex{

    constructor(

        readonly id:IndexId,

        readonly name:string,

        readonly tenantId:string,

        readonly shards:number,

        readonly replicas:number,

        readonly status:IndexStatus

    ){}

}
