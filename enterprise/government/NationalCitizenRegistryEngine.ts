// ============================================================================
// FILE:
// /enterprise/government/NationalCitizenRegistryEngine.ts
// ============================================================================

import { Citizen } from "./Citizen";

export class NationalCitizenRegistryEngine{

    register(

        citizen:Citizen

    ){

        return{

            citizen,

            registered:true

        };

    }

}
