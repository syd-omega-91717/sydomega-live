// ============================================================================
// FILE: /backend/src/modules/notification/domain/aggregates/notification.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { NotificationId }
from "../value-objects/notification-id";

export class NotificationAggregate
extends AggregateRoot<NotificationId>{

    validate(){}

    schedule(){}

    dispatch(){}

    retry(){}

    archive(){}

}
