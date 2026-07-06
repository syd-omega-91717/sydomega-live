// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/WFSClient.ts
// ============================================================================

export class WFSClient{

    constructor(

        private readonly endpoint:string

    ){}

    featureType(

        type:string

    ){

        return`${this.endpoint}?service=WFS&typeName=${type}`;

    }

}
