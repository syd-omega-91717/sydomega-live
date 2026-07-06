// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/WMSClient.ts
// ============================================================================

export class WMSClient{

    constructor(

        private readonly endpoint:string

    ){}

    tile(

        layer:string

    ){

        return`${this.endpoint}?service=WMS&layer=${layer}`;

    }

}
