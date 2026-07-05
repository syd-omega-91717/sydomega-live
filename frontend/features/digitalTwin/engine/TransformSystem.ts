// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/TransformSystem.ts
// ============================================================================

import * as THREE from "three";

export interface Transform{

    position:THREE.Vector3;

    rotation:THREE.Euler;

    scale:THREE.Vector3;

}

export class TransformSystem{

    apply(

        object:THREE.Object3D,

        transform:Transform

    ){

        object.position.copy(

            transform.position

        );

        object.rotation.copy(

            transform.rotation

        );

        object.scale.copy(

            transform.scale

        );

    }

}
