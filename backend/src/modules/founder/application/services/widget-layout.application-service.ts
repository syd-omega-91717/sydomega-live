// ============================================================================
// FILE: /backend/src/modules/founder/application/services/widget-layout.application-service.ts
// NEW FILE
// ============================================================================

import type {

    WidgetManifestRepository

}

from "../../domain/repositories/widget-manifest.repository.js";

export class WidgetLayoutApplicationService {

    constructor(

        private readonly repository:

        WidgetManifestRepository

    ) {}

    async layout() {

        const widgets =

            await this.repository.manifests();

        return widgets

            .filter(

                widget => widget.enabled

            )

            .sort(

                (a,b)=>a.priority-b.priority

            );

    }

}
