// ============================================================================
// FILE: /backend/src/modules/geospatial/domain/events/geofence-entered.event.ts
// NEW FILE
// ============================================================================

export class GeofenceEnteredEvent{

    constructor(

        readonly assetId:string,

        readonly geofenceId:string

    ){}

}
