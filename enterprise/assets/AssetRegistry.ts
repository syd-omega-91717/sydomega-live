// ============================================================================
// FILE:
// /enterprise/assets/AssetRegistry.ts
// ============================================================================

import { Asset } from "./Asset";

export class AssetRegistry{

    private readonly assets=

    new Map<string,Asset>();

    register(

        asset:Asset

    ){

        this.assets.set(

            asset.id,

            asset

        );

    }

    find(

        id:string

    ){

        return this.assets.get(id);

    }

    all(){

        return [...this.assets.values()];

    }

}
