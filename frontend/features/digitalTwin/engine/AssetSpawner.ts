// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetSpawner.ts
// ============================================================================

import * as THREE from "three";

import {SceneManager}

from "./SceneManager";

export class AssetSpawner{

    constructor(

        private scene:SceneManager

    ){}

    cube(

        id:string,

        x:number,

        y:number,

        z:number

    ){

        const mesh=

        new THREE.Mesh(

            new THREE.BoxGeometry(),

            new THREE.MeshStandardMaterial({

                color:"#2ECC71"

            })

        );

        mesh.position.set(

            x,

            y,

            z

        );

        this.scene.register(

            id,

            mesh

        );

    }

}
