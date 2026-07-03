// ============================================================================
// FILE: /backend/src/modules/search/domain/entities/search-query.ts
// NEW FILE
// ============================================================================

import { SearchType }
from "../enums/search-type";

export class SearchQuery{

    constructor(

        readonly query:string,

        readonly type:SearchType,

        readonly filters:Record<string,unknown>,

        readonly page:number,

        readonly pageSize:number

    ){}

}
