// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/AssetRegistry.ts
// ============================================================================

import * as THREE from "three";

export class AssetRegistry{

    private registry=

    new Map<string,THREE.Object3D>();

    register(

        id:string,

        asset:THREE.Object3D

    ){

        this.registry.set(

            id,

            asset

        );

    }

    get(id:string){

        return this.registry.get(id);

    }

    remove(id:string){

        this.registry.delete(id);

    }

    all(){

        return [...this.registry.values()];

    }

}
