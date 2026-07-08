// ============================================================================
// FILE:
// /enterprise/data-fabric/DataFabricEngine.ts
// ============================================================================

import { DataAsset } from "./DataAsset";

export class DataFabricEngine{

    private readonly assets=

    new Map<string,DataAsset>();

    register(

        asset:DataAsset

    ){

        this.assets.set(

            asset.id,

            asset

        );

    }

    discover(){

        return [...this.assets.values()];

    }

}
