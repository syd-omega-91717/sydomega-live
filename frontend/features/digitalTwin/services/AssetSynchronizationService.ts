// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/AssetSynchronizationService.ts
// ============================================================================

import {SceneManager}

from "../engine/SceneManager";

export class AssetSynchronizationService{

    constructor(

        private scene:SceneManager

    ){}

    synchronize(

        packets:any[]

    ){

        packets.forEach(packet=>{

            this.scene.updateTransform(

                packet.assetId,

                packet.x,

                packet.y,

                packet.z

            );

        });

    }

}
