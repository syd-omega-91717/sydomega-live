// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/MaterialFactory.ts
// ============================================================================

import * as THREE from "three";

export class MaterialFactory{

    static online(){

        return new THREE.MeshStandardMaterial({

            color:"#2ECC71",

            metalness:0.4,

            roughness:0.5

        });

    }

    static warning(){

        return new THREE.MeshStandardMaterial({

            color:"#F39C12",

            metalness:0.4,

            roughness:0.5

        });

    }

    static offline(){

        return new THREE.MeshStandardMaterial({

            color:"#E74C3C",

            metalness:0.4,

            roughness:0.5

        });

    }

}
