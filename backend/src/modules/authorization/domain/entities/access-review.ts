// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-review.ts
// NEW FILE
// ============================================================================

import { AccessReviewId }
from "../value-objects/access-review-id";

import { AccessReviewStatus }
from "../enums/access-review-status";

import { AccessReviewItem }
from "./access-review-item";

export class AccessReview{

    constructor(

        readonly id:AccessReviewId,

        readonly name:string,

        readonly reviewerId:string,

        readonly status:AccessReviewStatus,

        readonly dueDate:Date,

        readonly items:AccessReviewItem[]

    ){}

}
