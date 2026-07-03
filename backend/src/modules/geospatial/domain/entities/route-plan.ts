// ============================================================================
// FILE: /backend/src/modules/geospatial/domain/entities/route-plan.ts
// NEW FILE
// ============================================================================

export class RoutePlan{

    constructor(

        readonly routeId:string,

        readonly origin:string,

        readonly destination:string,

        readonly estimatedDistance:number,

        readonly estimatedDuration:number

    ){}

}
