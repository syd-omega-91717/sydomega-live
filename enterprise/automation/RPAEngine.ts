// ============================================================================
// FILE:
// /enterprise/automation/RPAEngine.ts
// ============================================================================

import { RobotProcess } from "./RobotProcess";

export class RPAEngine{

    execute(

        process:RobotProcess

    ){

        return{

            process,

            completed:true

        };

    }

}
