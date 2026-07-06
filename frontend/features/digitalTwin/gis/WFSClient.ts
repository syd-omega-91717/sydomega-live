// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/WFSClient.ts
// ============================================================================

export class WFSClient{

    constructor(

        private endpoint:string

    ){}

    features(

        layer:string

    ){

        return`${this.endpoint}`+

        `?service=WFS`+

        `&request=GetFeature`+

        `&typeName=${layer}`;

    }

}
