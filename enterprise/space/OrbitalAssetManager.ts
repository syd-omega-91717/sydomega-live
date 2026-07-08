// ============================================================================
// FILE:
// /enterprise/space/OrbitalAssetManager.ts
// ============================================================================

import { OrbitalAsset } from "./OrbitalAsset";

export class OrbitalAssetManager{

    private readonly registry=

    new Map<string,OrbitalAsset>();

    register(

        asset:OrbitalAsset

    ){

        this.registry.set(

            asset.id,

            asset

        );

    }

    list(){

        return [...this.registry.values()];

    }

}
