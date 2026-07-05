// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/LODManager.ts
// ============================================================================

import * as THREE from "three";

export class LODManager{

    create(

        high:THREE.Object3D,

        medium:THREE.Object3D,

        low:THREE.Object3D

    ){

        const lod=new THREE.LOD();

        lod.addLevel(high,0);

        lod.addLevel(medium,40);

        lod.addLevel(low,100);

        return lod;

    }

}
