// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneManager.ts
// UPDATED
// ============================================================================

import * as THREE from "three";

import {Lighting} from "./Lighting";
import {GridFactory} from "./GridFactory";
import {AxesFactory} from "./AxesFactory";

export class SceneManager{

    readonly scene:THREE.Scene;

    private assets=

    new Map<string,THREE.Object3D>();

    constructor(

        scene:THREE.Scene

    ){

        this.scene=scene;

        scene.background=

        new THREE.Color(

            "#0B1020"

        );

        Lighting.initialize(scene);

        scene.add(

            GridFactory.create()

        );

        scene.add(

            AxesFactory.create()

        );

    }

    register(

        id:string,

        object:THREE.Object3D

    ){

        this.assets.set(

            id,

            object

        );

        this.scene.add(

            object

        );

    }

    updateTransform(

        id:string,

        x:number,

        y:number,

        z:number

    ){

        const asset=

        this.assets.get(id);

        if(!asset){

            return;

        }

        asset.position.set(

            x,

            y,

            z

        );

    }

    remove(

        id:string

    ){

        const asset=

        this.assets.get(id);

        if(!asset){

            return;

        }

        this.scene.remove(asset);

        this.assets.delete(id);

    }

    dispose(){

        this.scene.clear();

        this.assets.clear();

    }

}
