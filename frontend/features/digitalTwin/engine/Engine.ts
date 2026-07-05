// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/Engine.ts
// UPDATED
// ============================================================================

import * as THREE from "three";

import {Renderer} from "./Renderer";
import {CameraManager} from "./CameraManager";
import {SceneManager} from "./SceneManager";
import {AnimationLoop} from "./AnimationLoop";
import {OrbitController} from "./OrbitController";

export class Engine{

    readonly scene=

    new THREE.Scene();

    readonly renderer:Renderer;

    readonly camera:CameraManager;

    readonly sceneManager:SceneManager;

    readonly controls:OrbitController;

    readonly animation:AnimationLoop;

    constructor(

        container:HTMLDivElement

    ){

        this.renderer=

        new Renderer(container);

        this.camera=

        new CameraManager(container);

        this.sceneManager=

        new SceneManager(this.scene);

        this.controls=

        new OrbitController(

            this.camera.camera,

            this.renderer.renderer.domElement

        );

        this.animation=

        new AnimationLoop(

            this.scene,

            this.camera.camera,

            this.renderer.renderer,

            this.controls

        );

    }

    start(){

        this.animation.start();

    }

    dispose(){

        this.animation.stop();

        this.controls.dispose();

        this.renderer.dispose();

        this.sceneManager.dispose();

    }

}
