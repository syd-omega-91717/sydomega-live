// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneSnapshot.ts
// ============================================================================

import * as THREE from "three";

export interface Snapshot{

    id:string;

    timestamp:number;

    camera:{

        position:number[];

        rotation:number[];

    };

}

export class SceneSnapshot{

    create(

        camera:THREE.PerspectiveCamera

    ):Snapshot{

        return{

            id:crypto.randomUUID(),

            timestamp:Date.now(),

            camera:{

                position:[

                    camera.position.x,

                    camera.position.y,

                    camera.position.z

                ],

                rotation:[

                    camera.rotation.x,

                    camera.rotation.y,

                    camera.rotation.z

                ]

            }

        };

    }

}
