// ============================================================================
// FILE: /backend/src/modules/geospatial/domain/entities/location-point.ts
// NEW FILE
// ============================================================================

export class LocationPoint{

    constructor(

        readonly latitude:number,

        readonly longitude:number,

        readonly altitude:number|null,

        readonly timestamp:Date

    ){}

}
