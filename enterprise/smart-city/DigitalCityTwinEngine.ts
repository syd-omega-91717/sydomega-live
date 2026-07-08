// ============================================================================
// FILE:
// /enterprise/smart-city/DigitalCityTwinEngine.ts
// ============================================================================

import { DigitalCityTwin } from "./DigitalCityTwin";

export class DigitalCityTwinEngine{

    synchronize(

        twin:DigitalCityTwin

    ){

        twin.synchronized=true;

        return twin;

    }

}
