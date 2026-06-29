// ============================================================================
// FILE: /backend/src/modules/founder/application/services/widget.application-service.ts
// NEW FILE
// ============================================================================

import type {

    WidgetRepository

}

from "../../domain/repositories/widget.repository.js";

export class WidgetApplicationService{

    constructor(

        private readonly repository:

        WidgetRepository

    ){}

    public widgets(){

        return this.repository.all();

    }

}
