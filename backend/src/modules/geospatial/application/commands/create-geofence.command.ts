// ============================================================================
// FILE: /backend/src/modules/geospatial/application/commands/create-geofence.command.ts
// NEW FILE
// ============================================================================

export class CreateGeofenceCommand{

    constructor(

        readonly name:string,

        readonly polygon:string

    ){}

}
