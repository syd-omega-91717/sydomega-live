// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/SnapshotService.ts
// ============================================================================

import {Snapshot}

from "../engine/SceneSnapshot";

export class SnapshotService{

    async save(

        snapshot:Snapshot

    ){

        return fetch(

            "/api/digital-twin/snapshots",

            {

                method:"POST",

                headers:{

                    "Content-Type":

                    "application/json"

                },

                body:JSON.stringify(snapshot)

            }

        );

    }

}
