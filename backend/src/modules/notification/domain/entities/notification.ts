// ============================================================================
// FILE: /backend/src/modules/notification/domain/entities/notification.ts
// NEW FILE
// ============================================================================

import { NotificationId }
from "../value-objects/notification-id";

import { ChannelType }
from "../enums/channel-type";

import { DeliveryStatus }
from "../enums/delivery-status";

export class Notification{

    constructor(

        readonly id:NotificationId,

        readonly recipient:string,

        readonly channel:ChannelType,

        readonly template:string,

        readonly payload:Record<string,unknown>,

        readonly status:DeliveryStatus,

        readonly scheduledAt:Date|null

    ){}

}
