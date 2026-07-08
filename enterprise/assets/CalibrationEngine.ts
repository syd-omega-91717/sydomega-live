// ============================================================================
// FILE:
// /enterprise/assets/CalibrationEngine.ts
// ============================================================================

import { Calibration } from "./Calibration";

export class CalibrationEngine{

    perform(

        calibration:Calibration

    ){

        calibration.nextCalibration=

        Date.now()+31536000000;

        return calibration;

    }

}
