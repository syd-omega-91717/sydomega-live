// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/CollisionManager.ts
// ============================================================================

import * as THREE from "three";

export class CollisionManager{

    intersects(

        a:THREE.Box3,

        b:THREE.Box3

    ){

        return a.intersectsBox(b);

    }

}
