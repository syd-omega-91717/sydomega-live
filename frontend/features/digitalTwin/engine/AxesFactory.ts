// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AxesFactory.ts
// ============================================================================

import * as THREE from "three";

export class AxesFactory{

    static create(

        size=10

    ){

        return new THREE.AxesHelper(

            size

        );

    }

}
