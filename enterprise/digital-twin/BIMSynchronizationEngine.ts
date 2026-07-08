// ============================================================================
// FILE:
// /enterprise/digital-twin/BIMSynchronizationEngine.ts
// ============================================================================

import { BuildingModel } from "./BuildingModel";

export class BIMSynchronizationEngine{

    synchronize(

        model:BuildingModel

    ){

        model.synchronized=true;

        return model;

    }

}
