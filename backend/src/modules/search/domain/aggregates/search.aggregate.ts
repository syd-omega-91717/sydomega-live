// ============================================================================
// FILE: /backend/src/modules/search/domain/aggregates/search.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { IndexId }
from "../value-objects/index-id";

export class SearchAggregate
extends AggregateRoot<IndexId>{

    createIndex(){}

    indexDocument(){}

    search(){}

    reindex(){}

    deleteIndex(){}

}
