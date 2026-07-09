// ============================================================================
// FILE:
// /enterprise/robotics/RoboticsFleetEngine.ts
// ============================================================================

import { Robot } from "./Robot";

export class RoboticsFleetEngine{

    register(

        robot:Robot

    ){

        return{

            robot,

            registered:true

        };

    }

}
