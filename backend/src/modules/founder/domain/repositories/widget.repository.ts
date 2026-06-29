// ============================================================================
// FILE: /backend/src/modules/founder/domain/repositories/widget.repository.ts
// NEW FILE
// ============================================================================

import { Widget }

from "../entities/widget.entity.js";

export interface WidgetRepository {

    all(): Promise<Widget[]>;

    find(id:string):Promise<Widget | null>;

}
