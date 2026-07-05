// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SnapshotManager.ts
// ============================================================================

import {Snapshot}

from "./SceneSnapshot";

export class SnapshotManager{

    private snapshots:Snapshot[]=[];

    add(snapshot:Snapshot){

        this.snapshots.push(snapshot);

    }

    all(){

        return this.snapshots;

    }

    latest(){

        return this.snapshots.at(-1);

    }

    clear(){

        this.snapshots=[];

    }

}
