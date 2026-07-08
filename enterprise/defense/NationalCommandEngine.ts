// ============================================================================
// FILE:
// /enterprise/defense/NationalCommandEngine.ts
// ============================================================================

import { NationalCommandCenter } from "./NationalCommandCenter";

export class NationalCommandEngine{

    activate(

        center:NationalCommandCenter

    ){

        center.operational=true;

        return center;

    }

}
