// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/Clock.ts
// ============================================================================

import * as THREE from "three";

export class Clock{

    private readonly clock=

    new THREE.Clock();

    delta(){

        return this.clock.getDelta();

    }

    elapsed(){

        return this.clock.getElapsedTime();

    }

}
