// ============================================================================
// FILE: /backend/src/modules/search/infrastructure/repositories/search.repository.ts
// NEW FILE
// ============================================================================

import { SearchAggregate }
from "../../domain/aggregates/search.aggregate";

export interface SearchRepository{

    save(

        aggregate:SearchAggregate

    ):Promise<void>;

}
