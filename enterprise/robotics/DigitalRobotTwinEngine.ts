// ============================================================================
// FILE:
// /enterprise/robotics/DigitalRobotTwinEngine.ts
// ============================================================================

import { DigitalRobotTwin } from "./DigitalRobotTwin";

export class DigitalRobotTwinEngine{

    synchronize(

        twin:DigitalRobotTwin

    ){

        return{

            twin,

            synchronized:true

        };

    }

}
