// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/AssetQueryService.ts
// ============================================================================

import {

AssetMetadataRegistry

}

from "../engine/AssetMetadataRegistry";

export class AssetQueryService{

    constructor(

        private registry:

        AssetMetadataRegistry

    ){}

    find(

        id:string

    ){

        return this.registry.get(id);

    }

}
