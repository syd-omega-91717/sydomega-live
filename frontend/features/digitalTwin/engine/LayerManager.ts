// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/LayerManager.ts
// ============================================================================

import * as THREE from "three";

export interface TwinLayer{

    id:string;

    name:string;

    visible:boolean;

    group:THREE.Group;

}

export class LayerManager{

    private readonly layers=

    new Map<string,TwinLayer>();

    register(

        layer:TwinLayer

    ){

        this.layers.set(

            layer.id,

            layer

        );

    }

    show(id:string){

        const layer=this.layers.get(id);

        if(!layer)return;

        layer.visible=true;

        layer.group.visible=true;

    }

    hide(id:string){

        const layer=this.layers.get(id);

        if(!layer)return;

        layer.visible=false;

        layer.group.visible=false;

    }

    toggle(id:string){

        const layer=this.layers.get(id);

        if(!layer)return;

        layer.visible=!layer.visible;

        layer.group.visible=layer.visible;

    }

    all(){

        return [...this.layers.values()];

    }

}
