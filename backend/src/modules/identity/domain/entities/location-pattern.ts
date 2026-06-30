// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/location-pattern.ts
// NEW FILE
// ============================================================================

export class LocationPattern{

    constructor(

        readonly country:string,

        readonly city:string,

        readonly latitude:number,

        readonly longitude:number,

        readonly confidence:number

    ){}

}
