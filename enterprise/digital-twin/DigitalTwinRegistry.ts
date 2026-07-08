// ============================================================================
// FILE:
// /enterprise/digital-twin/DigitalTwinRegistry.ts
// ============================================================================

import { DigitalTwin } from "./DigitalTwin";

export class DigitalTwinRegistry{

    private twins=new Map<string,DigitalTwin>();

    register(

        twin:DigitalTwin

    ){

        this.twins.set(

            twin.id,

            twin

        );

    }

    find(

        id:string

    ){

        return this.twins.get(id);

    }

}
