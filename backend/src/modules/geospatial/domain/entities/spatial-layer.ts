// ============================================================================
// FILE: /backend/src/modules/geospatial/domain/entities/spatial-layer.ts
// NEW FILE
// ============================================================================

import { SpatialId }
from "../value-objects/spatial-id";

import { LayerType }
from "../enums/layer-type";

export class SpatialLayer{

    constructor(

        readonly id:SpatialId,

        readonly name:string,

        readonly layerType:LayerType,

        readonly tenantId:string,

        readonly visible:boolean

    ){}

}
