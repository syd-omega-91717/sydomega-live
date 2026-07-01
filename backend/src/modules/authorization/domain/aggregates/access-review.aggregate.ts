// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/access-review.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AccessReviewId }
from "../value-objects/access-review-id";

export class AccessReviewAggregate
extends AggregateRoot<AccessReviewId>{

    start(){}

    approve(){}

    reject(){}

    complete(){}

    expire(){}

}
