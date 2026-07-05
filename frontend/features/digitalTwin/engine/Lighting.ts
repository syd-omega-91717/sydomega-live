// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/Lighting.ts
// ============================================================================

import * as THREE from "three";

export class Lighting{

    static initialize(

        scene:THREE.Scene

    ){

        const ambient=

        new THREE.AmbientLight(

            0xffffff,

            1

        );

        scene.add(ambient);

        const directional=

        new THREE.DirectionalLight(

            0xffffff,

            2

        );

        directional.position.set(

            100,

            250,

            100

        );

        directional.castShadow=true;

        scene.add(directional);

    }

}
