// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/LicensingEngine.ts
// ============================================================================

export interface License{

    key:string;

    tier:string;

    expires:number;

}

export class LicensingEngine{

    validate(

        license:License

    ){

        return license.expires>

        Date.now();

    }

}
