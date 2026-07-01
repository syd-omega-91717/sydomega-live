// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/access-review.repository.ts
// NEW FILE
// ============================================================================

import { AccessReviewAggregate }
from "../../domain/aggregates/access-review.aggregate";

export interface AccessReviewRepository{

    save(

        aggregate:AccessReviewAggregate

    ):Promise<void>;

    find(

        reviewId:string

    ):Promise<AccessReviewAggregate|null>;

    active(

    ):Promise<AccessReviewAggregate[]>;

}
