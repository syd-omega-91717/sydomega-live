// ============================================================================
// FILE: /backend/src/modules/geospatial/domain/entities/geofence.ts
// NEW FILE
// ============================================================================

export class Geofence{

    constructor(

        readonly geofenceId:string,

        readonly name:string,

        readonly polygon:string,

        readonly enabled:boolean

    ){}

}
