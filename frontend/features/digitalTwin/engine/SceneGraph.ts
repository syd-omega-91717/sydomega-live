// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneGraph.ts
// ============================================================================

import * as THREE from "three";

export class SceneGraph{

    private readonly nodes=

    new Map<string,THREE.Object3D>();

    register(

        id:string,

        node:THREE.Object3D

    ){

        this.nodes.set(id,node);

    }

    find(

        id:string

    ){

        return this.nodes.get(id);

    }

    remove(

        id:string

    ){

        this.nodes.delete(id);

    }

    children(){

        return [...this.nodes.values()];

    }

    clear(){

        this.nodes.clear();

    }

}
