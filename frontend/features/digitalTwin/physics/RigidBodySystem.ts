// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/RigidBodySystem.ts
// ============================================================================

import * as THREE from "three";

export class RigidBodySystem{

    applyForce(

        object:THREE.Object3D,

        force:THREE.Vector3

    ){

        object.position.add(

            force.clone()

            .multiplyScalar(0.016)

        );

    }

}
