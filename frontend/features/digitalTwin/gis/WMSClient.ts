// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/WMSClient.ts
// ============================================================================

export class WMSClient{

    constructor(

        private endpoint:string

    ){}

    tile(

        layer:string,

        bbox:string

    ){

        return`${this.endpoint}`+

        `?service=WMS`+

        `&request=GetMap`+

        `&layers=${layer}`+

        `&bbox=${bbox}`;

    }

}
