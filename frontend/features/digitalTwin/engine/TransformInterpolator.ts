// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/TransformInterpolator.ts
// ============================================================================

import * as THREE from "three";

export class TransformInterpolator{

    interpolate(

        object:THREE.Object3D,

        target:THREE.Vector3,

        alpha:number

    ){

        object.position.lerp(

            target,

            alpha

        );

    }

}
