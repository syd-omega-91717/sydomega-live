// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetAnimator.ts
// ============================================================================

import * as THREE from "three";

export class AssetAnimator{

    rotate(

        object:THREE.Object3D,

        delta:number

    ){

        object.rotation.y+=delta;

    }

    pulse(

        object:THREE.Mesh,

        scale:number

    ){

        object.scale.set(

            scale,

            scale,

            scale

        );

    }

}
