// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/crdt/SceneCRDT.ts
// ============================================================================

import {CRDTDocument}

from "./CRDTDocument";

export interface SceneOperation{

    assetId:string;

    field:string;

    value:any;

}

export class SceneCRDT{

    private readonly document=

    new CRDTDocument<SceneOperation>();

    commit(

        actor:string,

        payload:SceneOperation

    ){

        this.document.apply({

            id:crypto.randomUUID(),

            actor,

            timestamp:Date.now(),

            payload

        });

    }

    history(){

        return this.document.history();

    }

}
