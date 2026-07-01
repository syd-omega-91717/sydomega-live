// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/access-review.service.ts
// NEW FILE
// ============================================================================

import { AccessReview }
from "../../domain/entities/access-review";

export interface AccessReviewService{

    active():Promise<AccessReview[]>;

    overdue():Promise<AccessReview[]>;

}
