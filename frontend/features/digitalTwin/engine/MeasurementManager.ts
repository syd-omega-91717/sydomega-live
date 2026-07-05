// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/MeasurementManager.ts
// ============================================================================

import * as THREE from "three";

export class MeasurementManager{

    distance(

        a:THREE.Vector3,

        b:THREE.Vector3

    ){

        return a.distanceTo(b);

    }

    midpoint(

        a:THREE.Vector3,

        b:THREE.Vector3

    ){

        return new THREE.Vector3(

            (a.x+b.x)/2,

            (a.y+b.y)/2,

            (a.z+b.z)/2

        );

    }

}
