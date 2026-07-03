// ============================================================================
// FILE: /backend/src/modules/notification/domain/entities/delivery-report.ts
// NEW FILE
// ============================================================================

export class DeliveryReport{

    constructor(

        readonly notificationId:string,

        readonly delivered:boolean,

        readonly deliveredAt:Date|null,

        readonly retries:number

    ){}

}
