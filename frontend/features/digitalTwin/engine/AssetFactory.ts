// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetFactory.ts
// ============================================================================

import * as THREE from "three";

import {MaterialFactory}

from "./MaterialFactory";

export class AssetFactory{

    static cube(status:string){

        return new THREE.Mesh(

            new THREE.BoxGeometry(1,1,1),

            status==="ONLINE"

                ?MaterialFactory.online()

                :status==="WARNING"

                ?MaterialFactory.warning()

                :MaterialFactory.offline()

        );

    }

}
