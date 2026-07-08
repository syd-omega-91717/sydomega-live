// ============================================================================
// FILE:
// /enterprise/assets/EquipmentLifecycleEngine.ts
// ============================================================================

import { Asset } from "./Asset";

export class EquipmentLifecycleEngine{

    activate(

        asset:Asset

    ){

        asset.status="ACTIVE";

        return asset;

    }

    retire(

        asset:Asset

    ){

        asset.status="RETIRED";

        return asset;

    }

}
