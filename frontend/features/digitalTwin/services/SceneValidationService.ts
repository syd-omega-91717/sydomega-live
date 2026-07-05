// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/SceneValidationService.ts
// ============================================================================

import {

SceneValidator

}

from "../engine/SceneValidator";

export class SceneValidationService{

    private validator=

    new SceneValidator();

    validate(

        assets:any[]

    ){

        return this.validator.validate(

            assets

        );

    }

}
