// ============================================================================
// FILE: /backend/src/modules/notification/infrastructure/repositories/notification.repository.ts
// NEW FILE
// ============================================================================

import { NotificationAggregate }
from "../../domain/aggregates/notification.aggregate";

export interface NotificationRepository{

    save(

        aggregate:NotificationAggregate

    ):Promise<void>;

}
