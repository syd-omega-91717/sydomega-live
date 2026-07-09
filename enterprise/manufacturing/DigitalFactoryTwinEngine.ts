// ============================================================================
// FILE:
// /enterprise/manufacturing/DigitalFactoryTwinEngine.ts
// ============================================================================

import { DigitalFactory } from "./DigitalFactory";

export class DigitalFactoryTwinEngine{

    synchronize(

        factory:DigitalFactory

    ){

        return{

            factory,

            synchronized:true

        };

    }

}
