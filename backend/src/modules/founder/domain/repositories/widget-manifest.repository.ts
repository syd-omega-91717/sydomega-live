// ============================================================================
// FILE: /backend/src/modules/founder/domain/repositories/widget-manifest.repository.ts
// NEW FILE
// ============================================================================

import {

    WidgetManifest

}

from "../entities/widget-manifest.entity.js";

export interface WidgetManifestRepository {

    manifests():

        Promise<WidgetManifest[]>;

}
