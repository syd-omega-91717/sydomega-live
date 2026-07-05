// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/GridFactory.ts
// ============================================================================

import * as THREE from "three";

export class GridFactory{

    static create(){

        const grid=

        new THREE.GridHelper(

            1000,

            100,

            0x666666,

            0x333333

        );

        grid.receiveShadow=true;

        return grid;

    }

}
