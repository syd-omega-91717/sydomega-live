// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/Engine.ts
// ============================================================================

import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import { CameraManager } from "./CameraManager";
import { Renderer } from "./Renderer";
import { AnimationLoop } from "./AnimationLoop";

export class Engine{

    readonly scene:THREE.Scene;

    readonly renderer:Renderer;

    readonly camera:CameraManager;

    readonly animation:AnimationLoop;

    readonly sceneManager:SceneManager;

    constructor(container:HTMLDivElement){

        this.scene=new THREE.Scene();

        this.renderer=new Renderer(container);

        this.camera=new CameraManager(container);

        this.sceneManager=new SceneManager(this.scene);

        this.animation=new AnimationLoop(

            this.scene,

            this.camera.camera,

            this.renderer.renderer

        );

    }

    start(){

        this.animation.start();

    }

    stop(){

        this.animation.stop();

    }

    resize(){

        this.camera.resize();

        this.renderer.resize();

    }

    dispose(){

        this.stop();

        this.renderer.dispose();

        this.sceneManager.dispose();

    }

}
